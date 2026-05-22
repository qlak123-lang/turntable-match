export interface Post {
  id: string;
  title: string;
  content: string;
  nickname: string;
  category: "counsel" | "qna" | "general";
  views: number;
  createdAt: string;
}

const CATEGORY_MAP = {
  counsel: "연애고민",
  qna: "Q&A",
  general: "자유잡담"
};

export const getCategoryLabel = (cat: Post["category"]) => CATEGORY_MAP[cat] || "일반";

// Pre-populated mock posts to demonstrate pagination (needs to be 21+ for page 2, 201+ for page 11)
const INITIAL_MOCK_POSTS: Post[] = [];

const NICKNAMES = [
  "사랑꾼라떼", "새벽감성", "턴테이블러", "매칭성공기원", "하트비트", 
  "달콤한모카", "어른이의연애", "고민많은사원", "소개팅장인", "인연을찾아서"
];

const COUNSEL_TITLES = [
  "첫 만남에서 와인 한 잔, 어떨까요?",
  "소개팅 애프터 신청 타이밍 언제쯤이 제일 좋나요?",
  "대화 코드가 안 맞으면 두 번째 만남은 의미 없을까요?",
  "미팅 나가기 전에 카톡 연락 주기, 어느 정도가 적당한가요?",
  "로테이션 미팅 2시간 동안 마음에 드는 사람 어필하는 팁",
  "첫 만남 코디 고민됩니다. 비즈니스 캐주얼 선호하나요?",
  "소개팅 상대가 마음에 드는데, 대화 리드하는 법 알려주세요.",
  "서로 직장 얘기만 하다가 끝났는데 시그널인가요?",
  "단둘이 만날 때 정막이 흐를까 봐 너무 걱정돼요.",
  "익명으로 여쭤봐요. 연락 두절된 애프터, 다시 연락해 볼까요?"
];

const QNA_TITLES = [
  "턴테이블 매치 참가할 때 나이 제한이 타이트한가요?",
  "재직 증명 사원증 제출할 때 마스킹 처리 다들 어떻게 하셨나요?",
  "정원 초과 시 대기 신청해 놓으면 순번 빨리 오나요?",
  "모임 분위기 어색하지 않게 스탭분들이 잘 이끌어 주시나요?",
  "매칭 후 연락처는 모임 끝난 당일 바로 공개되는 건가요?",
  "미팅 예약 후 당일 취소 시 위약금 규정이 어떻게 되나요?",
  "혼자 참가하시는 분들도 많은 편인지 궁금합니다.",
  "남자 나이대 보통 평균이 어떻게 되나요?",
  "대기업/공기업 직장인 비중이 정말 80% 이상인가요?",
  "결제하고 안내 문자는 언제 받아볼 수 있나요?"
];

const GENERAL_TITLES = [
  "오늘도 인연을 찾기 위해 대기 타는 중...",
  "다음 주 주말 세션 참가하시는 분들 화이팅입니다!",
  "이번 주 턴테이블 후기: 정말 신선한 경험이었어요.",
  "가볍지 않고 진중한 분위기라 마음에 드네요.",
  "여성 성비 남성 성비 진짜 잘 맞춰주는 듯요.",
  "모임 장소가 너무 이뻐서 긴장이 더 풀렸던 것 같아요.",
  "커피 한잔하면서 편안하게 이야기 나눴습니다.",
  "모임 끝나고 뒤풀이 참여율 보통 높은가요?",
  "다들 좋은 밤 되시고, 주말에 좋은 인연 만나시길!",
  "익명이라 이런 사소한 고민도 나눌 수 있어 참 좋네요."
];

const CONTENTS = [
  "안녕하세요. 이번에 처음 참여해보려고 하는데 너무 긴장되네요. 혹시 참여해보신 선배님들 팁이 있으시다면 사소한 거라도 좋으니 하나씩만 던져주시면 감사하겠습니다!",
  "매번 소개팅 나가면 첫 마디 떼기가 너무 어렵고 어색하더라구요. 이번 모임은 여러 명과 로테이션으로 대화한다고 들었는데, 대화를 매끄럽게 푸는 치트키 질문이 있을까요?",
  "사원증을 업로드하라고 해서 제출하려는데 주민등록번호 뒷자리나 회사 주소 같은 민감한 정보들은 다 가리고 올려도 승인이 잘 나는지 궁금합니다. 보안 정책은 안전하겠죠?",
  "대화 시간이 10분 내외로 한정되어 있다고 하던데, 짧은 시간 동안 저의 매력을 임팩트 있게 어필할 수 있는 방법이 있을까요? 조언 부탁드립니다.",
  "대기업, 공기업 위주 참가자 필터링이 확실하게 되는 것 같아 신청했는데 실제 분위기가 궁금해요. 진지하게 결혼까지 생각하시는 분들도 오시는지 알고 싶습니다."
];

// Generate 225 posts to test range shifting in pagination (1-10 page links, [Next] loads 11-12)
for (let i = 225; i >= 1; i--) {
  const categorySeed = i % 3;
  let category: Post["category"] = "general";
  let title = "";
  if (categorySeed === 0) {
    category = "counsel";
    title = COUNSEL_TITLES[i % COUNSEL_TITLES.length];
  } else if (categorySeed === 1) {
    category = "qna";
    title = QNA_TITLES[i % QNA_TITLES.length];
  } else {
    category = "general";
    title = GENERAL_TITLES[i % GENERAL_TITLES.length];
  }

  // Add variations to title to make it look realistic
  if (i % 7 === 0) title = `[실시간] ${title}`;
  if (i % 11 === 0) title = `🔥 ${title}`;

  const nickname = NICKNAMES[i % NICKNAMES.length] + (i % 13);
  const content = CONTENTS[i % CONTENTS.length] + `\n\n(익명 게시판에 작성된 ${i}번째 소중한 의견입니다.)`;
  const views = Math.floor(Math.random() * 120) + 5;
  
  // Distribute timestamps back in time
  const date = new Date();
  date.setMinutes(date.getMinutes() - (225 - i) * 45); // 45 minutes intervals
  
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const createdAt = `${yyyy}-${mm}-${dd} ${hh}:${min}`;

  INITIAL_MOCK_POSTS.push({
    id: `post-${i}`,
    title,
    content,
    nickname,
    category,
    views,
    createdAt
  });
}

// LocalStorage helpers
const STORAGE_KEY = "turntable_match_posts";

export const getPosts = (): Post[] => {
  if (typeof window === "undefined") return INITIAL_MOCK_POSTS;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_POSTS));
    return INITIAL_MOCK_POSTS;
  }
  
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_MOCK_POSTS;
  }
};

export const savePosts = (posts: Post[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }
};

export const addPost = (title: string, content: string, nickname: string, category: Post["category"]): Post => {
  const posts = getPosts();
  
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const createdAt = `${yyyy}-${mm}-${dd} ${hh}:${min}`;

  const newPost: Post = {
    id: `post-user-${Date.now()}`,
    title,
    content,
    nickname,
    category,
    views: 0,
    createdAt
  };

  const updatedPosts = [newPost, ...posts];
  savePosts(updatedPosts);
  return newPost;
};

export const getPostById = (id: string): Post | null => {
  const posts = getPosts();
  return posts.find(p => p.id === id) || null;
};

export const incrementViews = (id: string): Post | null => {
  const posts = getPosts();
  const index = posts.findIndex(p => p.id === id);
  if (index !== -1) {
    posts[index].views += 1;
    savePosts(posts);
    return posts[index];
  }
  return null;
};
