import RecentPost from './recentpost';

const Home: React.FC = () => {

  return (
    <div className=" max-w-xl mx-auto w-full">
      
      <main className="flex flex-col gap-4 row-start-2 items-center sm:items-start">
        <h1>Welcome to My Corner of the Internet</h1>
        
        <p>I'm David Hyppolite a self-taught Cloud Engineer driven by an unrelenting pursuit of excellence. This blog isn't just another tech space - it's where determination meets cloud innovation.</p>
        <p>What you're looking at right now? It's infrastructure-as-code poetry, orchestrated through Terraform, powered by AWS (S3, CloudFront, Route53, ACM), automated through GitHub Actions, and brought to life with Next.js. Every component represents another challenge conquered, another level mastered.</p>
        <p>Here, I'll document my journey, share my victories (and battles) with cloud technologies, and demonstrate how pure determination can transform ambitious goals into reality.</p>
       { /*<RecentPost />*/}
      </main>
    </div>
  )
}

export default Home;
