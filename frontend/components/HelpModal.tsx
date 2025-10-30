'use client';

import { X, MousePointer2, Move, Zap, Users, Tag } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
          <h2 className="text-2xl font-bold text-white">
            TaskFlow 사용 가이드
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8">
            {/* Welcome */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                👋 환영합니다!
              </h3>
              <p className="text-gray-600 leading-relaxed">
                TaskFlow는 팀 협업을 위한 칸반보드 도구입니다.
                <br />
                워크스페이스 안에서 보드를 만들고, 카드를 드래그앤드롭으로 관리하세요.
              </p>
            </div>

            {/* Quick Start */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                🚀 빠른 시작
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">워크스페이스 생성</p>
                    <p className="text-sm text-gray-600">
                      팀이나 프로젝트 단위로 워크스페이스를 만드세요.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">보드 생성</p>
                    <p className="text-sm text-gray-600">
                      워크스페이스 안에서 작업을 관리할 보드를 만드세요.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">컬럼 추가</p>
                    <p className="text-sm text-gray-600">
                      "할 일", "진행중", "완료" 같은 컬럼을 추가하세요.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">카드 생성</p>
                    <p className="text-sm text-gray-600">
                      작업 카드를 만들고 정보를 입력하세요.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                ⚡ 주요 기능
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MousePointer2 className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">카드 클릭</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    카드를 클릭하면 상세 정보를 보고 편집할 수 있습니다.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Move className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">드래그앤드롭</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    카드를 드래그해서 다른 컬럼으로 이동시키세요.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">담당자 지정</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    카드에 담당자를 지정하고 프로필을 표시하세요.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">라벨 & 마감일</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    라벨을 추가하고 마감일을 설정해 작업을 관리하세요.
                  </p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                💡 팁
              </h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <p className="text-gray-700">
                    <strong>제목 편집:</strong> 카드 상세 화면에서 제목을 클릭하면 바로 수정할 수 있습니다.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <p className="text-gray-700">
                    <strong>설명 추가:</strong> "설명" 영역을 클릭해서 자세한 내용을 입력하세요.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <p className="text-gray-700">
                    <strong>빠른 추가:</strong> 각 컬럼의 "+" 버튼으로 카드를 빠르게 추가하세요.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <p className="text-gray-700">
                    <strong>멤버 초대:</strong> 워크스페이스에 팀원을 초대해서 함께 작업하세요.
                  </p>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                ⌨️ 키보드 단축키
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">모달 닫기</span>
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">
                    Esc
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">편집 완료</span>
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">
                    Enter
                  </kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">편집 취소</span>
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">
                    Esc
                  </kbd>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                🤝 도움이 필요하신가요?
              </h4>
              <p className="text-sm text-blue-700">
                TaskFlow는 포트폴리오 프로젝트입니다.
                <br />
                GitHub 이슈나 이메일로 문의해주세요.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
