import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/supabase';
import cameraIcon from '@/assets/icons/diary/camera.png';

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

  useEffect(() => {
    const fetchPlaceData = async () => {
      if (!placeId) return;

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

            const regionPatterns = [
              /제주|제주도/,
              /서울|서울시/,
              /부산|부산시/,
              /대구|대구시/,
              /인천|인천시/,
              /광주|광주시/,
              /대전|대전시/,
              /울산|울산시/,
              /경기|경기도/,
              /강원|강원도/,
              /충북|충청북도/,
              /충남|충청남도/,
              /전북|전라북도/,
              /전남|전라남도/,
              /경북|경상북도/,
              /경남|경상남도/,
              /세종|세종시/,
            ];

            let regionName = '여행지';
            for (const pattern of regionPatterns) {
              for (const placeName of placeNames) {
                const match = placeName.match(pattern);
                if (match) {
                  const region = match[0];

                  if (
                    [
                      '서울',
                      '부산',
                      '대구',
                      '인천',
                      '광주',
                      '대전',
                      '울산',
                      '세종',
                    ].includes(region)
                  ) {
                    regionName = region;
                    break;
                  }

                  if (region.includes('도')) {
                    regionName = region;
                    break;
                  }
                  if (region.includes('시')) {
                    regionName = region;
                    break;
                  }
                  regionName = region + '도';
                  break;
                }
              }
              if (regionName !== '여행지') break;
            }

            alert(
              `🎉 축하합니다!\n${regionName} 뱃지를 획득했습니다!\n마이페이지에서 확인해보세요.`,
            );
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
          className="w-full aspect-square bg-gray-100 rounded-lg shadow-md flex items-center justify-center cursor-pointer hover:shadow-lg transition-all duration-200"
          onClick={() => fileInputRef.current?.click()}
        >
          {imagePreview ? (
            <div className="relative w-full h-full">
              <img
                src={imagePreview}
                alt="업로드된 이미지"
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-kakaoSmall opacity-0 hover:opacity-100 transition-opacity duration-200">
                  탭하면 이미지 수정
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <img
                src={cameraIcon}
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
    </div>
  );
};

export default DiaryRecordPage;
