import RecentPost from './recentpost';

const Home: React.FC = () => {

  return (
    <div className=" max-w-xl mx-auto w-full">
      
      <main className="flex flex-col gap-4 row-start-2 items-center sm:items-start">
        <h1>Welcome to my Blog</h1>
        
        <p>My Name is David Hyppolite a self-taught Cloud Engineer. On this blog I will sharing and Documenting my Journey and thoughts and technologies I am using. This entire blog's architecture is built using Terraform, AWS
        (S3, CloudFront, Route53, ACM), GitHub Actions for CI/CD, and Next.js.</p>
        <RecentPost />
      </main>
    </div>
  )
}

export default Home;
