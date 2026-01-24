import ogs from 'open-graph-scraper';

/**
 * URL에서 Open Graph 메타데이터를 추출합니다.
 * @param url 대상 URL
 * @returns OG 데이터 객체 (title, description, image 등)
 */
export async function fetchOGMetadata(url: string) {
    try {
        const { result } = await ogs({ url });

        // 필요한 정보만 정제하여 반환
        return {
            title: result.ogTitle || result.twitterTitle || '',
            description: result.ogDescription || result.twitterDescription || '',
            image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || '',
            url: result.ogUrl || url,
        };
    } catch (error) {
        console.error(`[OG Scraping Error] ${url}:`, error);
        // 에러 발생 시 빈 메타데이터 반환 (리소스 추가 자체를 막지 않기 위함)
        return {};
    }
}

/**
 * 리소스 타입과 카테고리에 따른 데이터 유효성을 검사합니다.
 * @param type 리소스 타입
 * @param category 리소스 카테고리
 * @param content 내용 (URL 또는 텍스트)
 */
export function validateResource(
    type: 'LINK' | 'TEXT',
    category: string,
    content: string
): { valid: boolean; message?: string } {
    // 1. LINK 타입 검증
    if (type === 'LINK') {
        // 간단한 URL 형식 체크 (너무 엄격한 정규식 대신 프로토콜 확인만 수행)
        if (!content.includes('http://') && !content.includes('https://')) {
            return { valid: false, message: 'URL은 http:// 또는 https:// 를 포함해야 합니다.' };
        }
    }

    // 2. 카테고리별 검증 (필요 시 추가)
    // 예: ACCOUNT 카테고리는 특정 포맷을 요구할 수 있음

    // 3. 내용 길이 검증
    if (!content || content.trim().length === 0) {
        return { valid: false, message: '내용을 입력해주세요.' };
    }

    return { valid: true };
}
