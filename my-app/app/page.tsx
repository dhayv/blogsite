import Link from "next/link";
import Header from "./header";

const Home = (): JSX.Element => {

  return (
    <div className=" max-w-xl mx-auto w-full">
      
      <main className="flex flex-col gap-4 row-start-2 items-center sm:items-start">
        <h1>Welcome to my Blog</h1>
        <p>My Name is David Hyppolite a self-taught Cloud Engineer. On this blog I will sharing and Documenting my Journey and thoughts and technologies I am using.</p>
      </main>
    </div>
  )
}

export default Home;
