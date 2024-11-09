import Image from 'next/image';
import Link from 'next/link';

const Header = () => {
  return (
    <header>
      <Link href=''>Home</Link>
      <Link href=''>Blog</Link>

      <a
        className="flex items-center gap-2 hover:underline hover:underline-offset-4"
        href="https://github.com/dhayv"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          src="/file.svg"
          alt="File icon"
          width={16}
          height={16}
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
          src="/window.svg"
          alt="Window icon"
          width={16}
          height={16}
        />
        LinkedIn
      </a>
    </header>
  )
}

export default Header;
