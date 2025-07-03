import RecentPost from './recentpost/page';

const Home: React.FC = () => {

  return (
    <div className=" max-w-xl mx-auto w-full">
      
      <main className="flex flex-col gap-4 row-start-2 items-center sm:items-start">
        <h1 className='text-3xl font-extrabold'>Welcome to My Corner of the Internet</h1>
        
        <p>I’m a Cloud & DevOps Architect who builds scalable, secure infrastructure using AWS, Terraform, Kubernetes, and automation pipelines. But this blog isn’t a résumé—it’s a blueprint.</p>
        <p>Everything here is deployed with <strong>Terraform</strong>, served through AWS <strong>S3, CloudFront, Route 53, and ACM</strong>, and automated via <strong>GitHub Actions</strong>—all stitched together in <strong>Next.js</strong>. It’s not just hosted in the cloud; it’s built to reflect how I solve real-world problems.</p>
        <p>I write to document strategy, not just story. You’ll find battle-tested solutions, breakdowns of infrastructure choices, and patterns that turn complexity into clarity. Whether you're building your stack or scaling your team, these are the insights I wish someone shared with me earlier.</p>
       { /**/}
       <RecentPost />
      </main>
    </div>
  )
}

export default Home;
