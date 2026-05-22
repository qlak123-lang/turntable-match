-- SQL DDL Schema for Turntable Match Community Board
-- Compatible with PostgreSQL / MySQL

-- 1. Posts Table (게시글 테이블)
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,                          -- 게시글 고유 ID (자동 증가 정수)
    title VARCHAR(200) NOT NULL,                    -- 게시글 제목
    content TEXT NOT NULL,                          -- 게시글 본문 내용
    nickname VARCHAR(50) NOT NULL,                  -- 작성자 익명 닉네임
    category VARCHAR(50) DEFAULT 'general',         -- 게시글 카테고리 (e.g. 'general', 'counsel', 'qna')
    views INTEGER DEFAULT 0,                        -- 조회수
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 최초 작성 일시
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- 최근 수정 일시
);

-- Index for faster query and sorting by created_at (최신글 정렬 및 조회를 위한 인덱스)
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- Index for searching categories (카테고리별 필터링을 위한 인덱스)
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
