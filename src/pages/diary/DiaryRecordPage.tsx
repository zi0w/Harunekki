import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/supabase';
import seasonalThumbnail from '@/assets/icons/seasonal/Thumbnail.webp';
import BadgeModal from '@/components/shared/BadgeModal';
import { extractRegionName } from '@/utils/regionUtils';
import { setDiaryCoverImage } from '@/lib/supabase/diaries';

type DiaryPlace = {
  id: string;
  place_name: string;
  day: number;
  order_index: number;
  visited: boolean;
  stamp_data?: {
    image_url?: string;
    title?: string;
    description?: string;
  };
};

const DiaryRecordPage = () => {
  const { diaryId, placeId } = useParams<{
    diaryId: string;
    placeId: string;
  }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [place, setPlace] = useState<DiaryPlace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 폼 데이터
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // 뱃지 모달 상태
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [badgeData, setBadgeData] = useState<{
    regionName: string;
  } | null>(null);
  const [isCoverImage, setIsCoverImage] = useState(false);
  const [settingCover, setSettingCover] = useState(false);

  // 커버 이미지 설정 함수
  const handleSetCoverImage = async () => {
    if (!diaryId || !imagePreview) return;

    setSettingCover(true);
    try {
      await setDiaryCoverImage(diaryId, imagePreview);
      setIsCoverImage(true);
    } catch (error) {
      console.error('커버 이미지 설정 실패:', error);
      alert('커버 이미지 설정 중 오류가 발생했습니다.');
    } finally {
      setSettingCover(false);
    }
  };

  useEffect(() => {
    const fetchPlaceData = async () => {
      if (!placeId) return;

      // 헤더 제목 설정
      (window as unknown as { diaryTitle?: string }).diaryTitle =
        '다이어리 기록';

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('diary_places')
          .select('*')
          .eq('id', placeId)
          .single();

        if (error) {
          console.error('Error fetching place:', error);
          return;
        }

        setPlace(data);

        // 기존 데이터가 있으면 폼에 채우기
        if (data.stamp_data) {
          setTitle(data.stamp_data.title || '');
          setDescription(data.stamp_data.description || '');
          if (data.stamp_data.image_url) {
            setImagePreview(data.stamp_data.image_url);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaceData();
  }, [placeId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = fileName; // 버킷 이름이 이미 'diary-images'이므로 중복 제거

      const { error: uploadError } = await supabase.storage
        .from('diary-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('diary-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!placeId || !title.trim()) {
      alert('여행지 기록을 입력해주세요.');
      return;
    }

    setSaving(true);

    try {
      let imageUrl = imagePreview;

      // 새 이미지가 있으면 업로드
      if (image) {
        const uploadedUrl = await uploadImage(image);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      const stampData = {
        image_url: imageUrl,
        title: title.trim(),
        description: description.trim(),
      };

      const { error } = await supabase
        .from('diary_places')
        .update({
          visited: true,
          stamp_data: stampData,
        })
        .eq('id', placeId);

      if (error) {
        console.error('Error saving record:', error);
        alert('저장 중 오류가 발생했습니다.');
        return;
      }

      // 뱃지 완성 여부 확인
      const { data: allPlaces } = await supabase
        .from('diary_places')
        .select('id, visited, stamp_data')
        .eq('diary_id', diaryId);

      if (allPlaces) {
        const totalPlaces = allPlaces.length;
        const completedPlaces = allPlaces.filter(
          (place) => place.visited && place.stamp_data?.image_url,
        ).length;

        // 모든 스탬프가 완성된 경우 뱃지 완성 알림
        if (totalPlaces > 0 && completedPlaces === totalPlaces) {
          // 지역명 추출 로직
          const { data: diaryData } = await supabase
            .from('diaries')
            .select(
              `
              title,
              diary_places!inner(place_name)
            `,
            )
            .eq('id', diaryId)
            .single();

          if (diaryData) {
            const places = diaryData.diary_places;
            const placeNames = places.map(
              (place: { place_name: string }) => place.place_name,
            );

            const regionName = extractRegionName(placeNames);

            // 뱃지 모달 표시
            setBadgeData({
              regionName,
            });
            setShowBadgeModal(true);

            // 모달이 표시된 후 페이지 이동하지 않음 (모달에서 확인 버튼 클릭 시 이동)
            return;
          }
        }
      }

      // 다이어리 상세 페이지로 돌아가기
      navigate(`/diary/${diaryId}`);
    } catch (error) {
      console.error('Error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setImagePreview('');
    setTitle('');
    setDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div
        className="w-full flex items-center justify-center"
        style={{ height: 'calc(100vh - 120px)' }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EF6F6F]"></div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="w-full flex items-center justify-center mt-20">
        <p className="text-[#596072]">장소 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col mt-6 gap-6 pb-4">
      {/* 이미지 업로드 */}
      <div className="w-full">
        <div
          className={`w-full aspect-square bg-gray-100 rounded-lg shadow-md flex items-center justify-center transition-all duration-200 ${
            isCoverImage ? 'cursor-default' : 'cursor-pointer hover:shadow-lg'
          }`}
          onClick={() => !isCoverImage && fileInputRef.current?.click()}
        >
          {imagePreview ? (
            <div className="relative w-full h-full">
              <img
                src={imagePreview}
                alt="업로드된 이미지"
                className="w-full h-full object-cover rounded-lg"
              />
              {!isCoverImage && (
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-kakaoSmall opacity-0 hover:opacity-100 transition-opacity duration-200">
                    탭하면 이미지 수정
                  </span>
                </div>
              )}
              {isCoverImage && (
                <div className="absolute top-2 right-2 bg-[#EF6F6F] text-white px-2 py-1 rounded-full text-xs font-kakaoSmall">
                  커버 이미지
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <img
                src={seasonalThumbnail}
                alt="카메라"
                className="w-10 h-10 mx-auto opacity-60"
              />
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        {/* 커버 이미지 설정 버튼 */}
        {imagePreview && !isCoverImage && (
          <div className="mt-3">
            <button
              onClick={handleSetCoverImage}
              disabled={settingCover}
              className="w-full py-2 px-4 bg-[#EF6F6F] text-white rounded-lg font-medium hover:bg-[#E55A5A] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {settingCover ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  등록 중입니다...
                </>
              ) : (
                '위 이미지를 다이어리 커버로 설정'
              )}
            </button>
          </div>
        )}
      </div>

      {/* 여행지 기록 */}
      <div>
        <label className="block text-[#383D48] font-kakaoSmall font-bold mb-2">
          여행지 기록
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={place?.place_name || '여행지 이름을 입력하세요'}
          className="w-full p-3 bg-white rounded-xl border font-kakaoSmall text-[14px] text-[#596072] placeholder:text-[#AEB6C6] outline-none"
        />
      </div>

      {/* 기록 상세 */}
      <div>
        <label className="block text-[#383D48] font-kakaoSmall font-bold mb-2">
          기록 상세{' '}
          <span className="text-[#9096A5] text-xs font-normal">
            (선택 입력)
          </span>
        </label>
        <div className="mt-3 rounded-xl border bg-white p-3">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="맛있었던 기록을 남겨보세요."
            maxLength={500}
            className="bg-white h-24 w-full resize-none outline-none font-kakaoSmall text-[14px] leading-6 text-[#596072] placeholder:text-[#AEB6C6]"
          />
          <div className="mt-2 text-right text-[12px] font-kakaoSmall text-[#9096A5]">
            ({description.length}/500)
          </div>
        </div>
      </div>

      {/* 버튼들 */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={handleReset}
          className="flex-1 py-3 bg-white rounded-lg text-[#596072] font-kakaoBig shadow-sm hover:shadow-md transition-all duration-200"
        >
          초기화
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="flex-1 py-3 rounded-lg text-white font-kakaoBig shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:hover:bg-[#EF6F6F] hover:bg-[#E55A5A] disabled:hover:text-white bg-[#EF6F6F]"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      {/* 뱃지 획득 모달 */}
      {badgeData && (
        <BadgeModal
          isOpen={showBadgeModal}
          onClose={() => {
            setShowBadgeModal(false);
            setBadgeData(null);
            // 모달 닫을 때 다이어리 상세 페이지로 이동
            navigate(`/diary/${diaryId}`);
          }}
          regionName={badgeData.regionName}
        />
      )}
    </div>
  );
};

export default DiaryRecordPage;
