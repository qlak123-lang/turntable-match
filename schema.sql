-- SQL DDL Schema for Turntable Match Community Board
-- Compatible with PostgreSQL / MySQL

-- 1. Users Table (회원 테이블)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,                          -- 사용자 고유 ID
    email VARCHAR(255) UNIQUE NOT NULL,             -- 이메일 (로그인 ID)
    password_hash VARCHAR(255) NOT NULL,            -- 비밀번호 해시
    nickname VARCHAR(100) NOT NULL,                 -- 닉네임
    is_admin BOOLEAN DEFAULT FALSE,                 -- 관리자 여부
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 가입 일시
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 정보 수정 일시
);

-- Index for users email searching
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Posts Table (게시글 테이블)
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,                          -- 게시글 고유 ID (자동 증가 정수)
    title VARCHAR(200) NOT NULL,                    -- 게시글 제목
    content TEXT NOT NULL,                          -- 게시글 본문 내용
    nickname VARCHAR(50) NOT NULL,                  -- 작성자 익명 닉네임
    category VARCHAR(50) DEFAULT 'general',         -- 게시글 카테고리 (e.g. 'general', 'counsel', 'qna')
    views INTEGER DEFAULT 0,                        -- 조회수
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL, -- 작성자 고유 ID (회원일 경우, 선택)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 최초 작성 일시
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 최근 수정 일시
);

-- Index for faster query and sorting by created_at (최신글 정렬 및 조회를 위한 인덱스)
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Index for searching categories (카테고리별 필터링을 위한 인덱스)
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);

-- Alter table to ensure user_id column is present if posts table already exists
ALTER TABLE posts ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- 3. Products Table (상품 테이블)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,                          -- 상품 고유 ID (자동 증가 정수)
    title VARCHAR(200) NOT NULL,                    -- 상품명
    description TEXT NOT NULL,                      -- 상품 설명
    price INTEGER NOT NULL,                         -- 가격 (KRW)
    category VARCHAR(50) NOT NULL,                  -- 카테고리 (e.g. 'ticket', 'consulting', 'matching')
    image_url TEXT,                                 -- 썸네일 이미지 URL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 등록 일시
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 수정 일시
);

-- Seed initial products if none exist
INSERT INTO products (title, description, price, category, image_url)
VALUES 
('삼청동 라운지 로테이션 미팅 1회권', '선별된 2030 직장인과의 2시간 진중한 대화 및 삼청동 프라이빗 라운지 웰컴 드링크/간단한 다과 제공권', 59000, 'ticket', '/images/product_ticket.png'),
('1:1 맞춤형 프로필 컨설팅', '전문 컨설턴트가 분석하는 프로필 사진 및 소개글 솔루션. 매칭 성공률 200% 증가 보장 서비스', 99000, 'consulting', '/images/product_consulting.png'),
('프리미엄 1:1 골드 매칭 티켓', '이상형 매칭 알고리즘 및 전문 매니저의 개별 매칭 조율을 통한 1:1 소개팅 보장권', 129000, 'matching', '/images/product_premium.png')
ON CONFLICT DO NOTHING;

-- 4. Orders Table (주문/결제 내역 테이블)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,                          -- 주문 고유 ID
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- 주문자 고유 ID
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE, -- 구매 상품 고유 ID
    price INTEGER NOT NULL,                         -- 결제 당시 금액
    payment_method VARCHAR(50) NOT NULL,            -- 결제 수단 (e.g. 'card', 'kakaopay', 'tosspay')
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 결제 일시
);

-- Index for users order query
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);


