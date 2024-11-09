import Image from 'next/image';
import Link from 'next/link';
// use icon8 for svg's
const Header = (): JSX.Element => {
  return (
    <nav>
      <Link href=''>Home</Link>
      <Link href=''>Blog</Link>

      <a
        className="flex items-center gap-2 hover:underline hover:underline-offset-4"
        href="https://github.com/dhayv"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          src="/github-mark.svg"
          alt="File icon"
          width={25}
          height={25}
        />
        GitHub
      </a>
      <a
        className="flex items-center gap-2 hover:underline hover:underline-offset-4"
        href="https://www.linkedin.com/in/david-hyppolite-60560b61/"
        target="_blank"
        rel="noopener noreferrer"
      >
        
        <Image
          src="/icons8-linkedin (1).svg"
          alt="Window icon"
          width={25}
          height={25}
        />
        LinkedIn
      </a>
    </nav>
  )
}

export default Header;
