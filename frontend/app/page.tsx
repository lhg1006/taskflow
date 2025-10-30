import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">
            TaskFlow
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl">
            팀을 위한 실시간 협업 칸반보드.
            업무를 정리하고, 프로젝트를 관리하며, 원활하게 협업하세요.
          </p>
          <div className="flex gap-4">
            <Link
              href="/register"
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              시작하기
            </Link>
            <Link
              href="/login"
              className="px-8 py-3 bg-white text-blue-600 font-medium rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition"
            >
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
