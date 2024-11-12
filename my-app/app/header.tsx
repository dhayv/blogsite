import Image from 'next/image';
import Link from 'next/link';
// use icon8 for svg's
const Header = (): JSX.Element => {
  return (
    <nav className="flex flex-wrap justify-center space-x-6 ">
      
      <div className='flex items-center space-x-6'>

      <Link href=''>Home</Link>
      
      
      <Link href=''>Blog</Link>
      </div>
      
     <div className='flex items-center space-x-6'>
     <a
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
      </a>
      <a
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
      </a>
     </div>
      
      

      
    </nav>
  )
}

export default Header;
