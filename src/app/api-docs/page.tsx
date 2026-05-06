import { getApiDocs } from '@/lib/swagger';
import ReactSwagger from './ReactSwagger';

export default async function IndexPage() {
  const spec = await getApiDocs();
  
  return (
    <section className="container mx-auto p-4 bg-white min-h-screen">
      <div className="mb-4 text-center font-neodgm text-gray-500">
         이 페이지는 개발자를 위한 백엔드 API 명세(Swagger) 페이지입니다.
      </div>
      <ReactSwagger spec={spec} />
    </section>
  );
}
