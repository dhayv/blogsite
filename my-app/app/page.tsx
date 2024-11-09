import Link from "next/link";
import Header from "./header";

const Home = (): JSX.Element => {

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1>Welcome to my Blog</h1>
        <p>My Name is David Hyppolite a self-taught Cloud Engineer. On this blog I will sharing and Documenting my Journey and thoughts and technologies I am using.</p>
      </main>
    </div>
  )
}

export default Home;
