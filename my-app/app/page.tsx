import RecentPost from './recentpost/page';

const Home: React.FC = () => {

  return (
    <div className=" max-w-xl mx-auto w-full">
      
      <main className="flex flex-col gap-4 row-start-2 items-center sm:items-start">
        <h1 className='text-3xl font-extrabold'>Welcome to My Corner of the Internet</h1>
        
        <p>I'm David Hyppolite a Cloud/DevOps Engineer specializing in AWS, Terraform, Kubernetes, Linux, Docker, CI/CD, automation. This blog isn't just another tech space - it's where determination meets cloud innovation.</p>
        <p>This blog is orchestrated through <strong>Terraform</strong>, powered by AWS (S3, CloudFront, Route53, ACM), automated and deployed with <strong>GitHub Actions</strong>, and brought to life with Next.js. Every component represents another challenge conquered, another level mastered.</p>
        <p>Here, I'll document my journey, share my victories (and battles) with cloud technologies, and demonstrate how pure determination can transform ambitious goals into reality.</p>
       { /**/}
       <RecentPost />
      </main>
    </div>
  )
}

export default Home;
