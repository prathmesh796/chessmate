import Link from 'next/link';

import Navbar from "@/components/Navbar";

export default async function Page({ params }: { params: Promise<{ username: string }> }) {
  const username = (await params).username;

  let playerData, status;
  try {
    const response = await fetch(`https://api.chess.com/pub/player/${username}`);
    const isOnline = await fetch(`https://api.chess.com/pub/player/${username}/is-online`);
    if (!response.ok) {
      const errorMessage = await response.text(); // Get the response body
      console.error('Error fetching player data:', response.status, errorMessage);
    }
    playerData = await response.json();
    status = await isOnline.json();
  } catch (error) {
    console.error('Error :', error);
    return <div>Error loading player data.</div>;
  }

  return (
    <>
      <header>
        <Navbar />
      </header>
      <main className="flex min-h-screen px-44 py-10 bg-profile_bg">
        {/* Sidebar */}
        <aside className="w-1/4 p-4 rounded-lg bg-profile_card text-white">
          <div className="flex items-center justify-around mb-4">
            <Link href={playerData.url}>
              <img
                src={playerData.avatar || '/userimg.png'}
                alt={`${playerData.username}'s avatar`}
                className="w-14 h-14 rounded-full mx-auto"
              />
            </Link>

            <div className="flex flex-col items-left justify-center">
              <Link href={playerData.url}><h2 className="text-xl font-semibold text-center mb-2">{playerData.username}</h2></Link>
              <div className='flex items-center gap-1'>
                <div className={`w-2 h-2 rounded-full ml-2 ${status.online ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <p className='text-gray-600'>{status.online ? 'Online' : 'Offline'}</p>
              </div>
            </div>
          </div>

          <div className='bg-gray-700 h-[1px] w-5/4 rounded-full mb-4'></div>

          <p>Rating: <span className="font-bold">{playerData.rating}</span></p>
          <p>Completion Rate: <span className="font-bold">{playerData.completion_rate}</span></p>
          <p>Play Time: <span className="font-bold">{playerData.play_time}</span></p>
          <p>Chess Title: <span className="font-bold">{playerData.title}</span></p>
          <p>Location: <span className="font-bold">{playerData.location}</span></p>
          <p>Is Online: <span className="font-bold">{playerData.is_online ? 'Yes' : 'No'}</span></p>
          <p>Is Suspended: <span className="font-bold">{playerData.is_suspended ? 'Yes' : 'No'}</span></p>
          <p>Is Patron: <span className="font-bold">{playerData.is_patron ? 'Yes' : 'No'}</span></p>
        </aside>

        
        <article className='flex flex-col w-3/4 mx-4'>
          <nav className='flex justify-start p-4 rounded-lg bg-profile_card mb-4'>
            <ul className='flex gap-4'>
              <li className='text-white'>Rapid</li>
              <li className='text-white'>Daily</li>
              <li className='text-white'>Blitz</li>
              <li className='text-white'>Bullet</li>
            </ul>
          </nav>

          {/* Graph of the players ration */}
          <section className='w-full min-h-40 p-4 rounded-lg bg-profile_card mb-4'>
            
          </section>

          {/* win/lose percentage */}
          <section className='w-full min-h-40 p-4 rounded-lg bg-profile_card mb-4'>

          </section >

          {/* heatmap */}
          <section className='w-full min-h-40 p-4 rounded-lg bg-profile_card mb-4'>

          </section>

          {/* previous games */}
          <section className='w-full min-h-40 p-4 rounded-lg bg-profile_card mb-4'>

          </section>
        </article>
        {/* <div className="flex-grow p-4">
          <h1 className="text-3xl font-bold">Hello {username}</h1>
          <div className="mt-4">
            <img src={playerData.avatar} alt={`${playerData.username}'s avatar`} className="w-24 h-24 rounded-full" />
            <p>Player ID: {playerData.player_id}</p>
            <p>URL: <a href={playerData.url} className="text-blue-500">{playerData.url}</a></p>
            <p>Followers: {playerData.followers}</p>
            <p>Country: {playerData.country}</p>
            <p>Last Online: {new Date(playerData.last_online * 1000).toLocaleString()}</p>
            <p>Joined: {new Date(playerData.joined * 1000).toLocaleString()}</p>
            <p>Status: {playerData.status}</p>
            <p>Is Streamer: <span className="font-bold">{playerData.is_streamer ? 'Yes' : 'No'}</span></p>
            <p>Verified: <span className="font-bold">{playerData.verified ? 'Yes' : 'No'}</span></p>
            <p>League: {playerData.league}</p>
            <p>Streaming Platforms: {playerData.streaming_platforms?.join(', ') || 'None'}</p>
          </div>
        </div> */}
      </main>
    </>
  );
}