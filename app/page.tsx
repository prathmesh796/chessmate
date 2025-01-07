import Image from "next/image";
import Form from 'next/form'

export default function Home() {
  return (
    <main>
      <div className="bgWrap">
        <Image
          src="/chess.com-bg.png"
          alt="Chessmate logo"
          layout="fill"
          objectFit="cover"
          quality={100}
        />
      </div>
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="m-4 text-6xl text-white font-bold">Chessmate</h1>
        <h3 className="text-xl text-white">A scrapper for your chess.com account.</h3>

        <Form action="/search">
          <input
            type="text"
            placeholder="Enter your chess.com username"
            className="h-10 w-96 rounded-full my-10 mx-5 p-5 outline-none text-black"
          />
          <button type="submit" className="h-10 w-36 bg-pawn rounded-full text-white">
            Search
          </button>
        </Form>
      </div>
    </main>
  );
}
