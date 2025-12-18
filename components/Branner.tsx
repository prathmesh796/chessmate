import Link from 'next/link';
import { FaGithub } from "react-icons/fa";

const Branner = () => {
    return (
        <nav className="flex items-center justify-between p-4 bg-black text-white shadow-md">
            <div className="flex-grow text-center text-4xl font-bold">Chessmate</div>
            <Link
                title='Github'
                href="https://github.com/prathmesh796/chessmate"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 text-white"
            >
                <FaGithub className='w-8 h-8' />
            </Link>
        </nav>
    );
};

export default Branner;
