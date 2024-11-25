import Image from 'next/image';
import Link from 'next/link';
// use icon8 for svg's


const Header: React.FC = () => {
  return (
    <nav className="flex flex-wrap justify-center space-x-6 ">
      
      <div className='flex items-center space-x-6'>

      <Link href='/' className="hover:underline">Home</Link>
      
      
      <Link href='/blog' className="hover:underline" passHref>Blog</Link>
      </div>
      
     <div className='flex items-center space-x-6'>
     <a
        href="https://github.com/dhayv"
        target="_blank"
        rel="noopener noreferrer"
        title='GitHub Profile'
        className="hover:opacity-75"
      >
        <Image
          src="/github-mark.svg"
          alt="File icon"
          width={16}
          height={16}
          
        />
      </a>
      <a
        href="https://www.linkedin.com/in/david-hyppolite-60560b61/"
        target="_blank"
        rel="noopener noreferrer"
        title='LinkedIn Profile'
        className="hover:opacity-75"
      >
        
        <Image
          src="/icons8-linkedin (1).svg"
          alt="Window icon"
          width={16}
          height={16}
        />
      </a>
     </div>
      
      

      
    </nav>
  )
}

export default Header;
