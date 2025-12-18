import { UserProfile } from '@/types/types'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, memo } from 'react'

const ProfileAside = memo(({ username }: { username: string }) => {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        // Fetch data from multiple endpoints
        const fetchUserData = async () => {
            try {
                const profileRes = await fetch(`https://api.chess.com/pub/player/${username}`);

                if (!profileRes.ok) throw new Error("User not found");

                const profileData = await profileRes.json();

                setUserProfile(profileData);

                //console.log("User Profile:", profileData);
            } catch (error) {
                console.error("Error fetching user data:", error);
                setUserProfile(null)
            }
        };

        if (username) {
            fetchUserData();
        }
    }, [username]);

    return (
        <div>
            {userProfile && (
                <div>
                    <div className="flex flex-col items-center mb-8 space-y-1">
                        <Link href={userProfile.url} className="group">
                            <Image
                                src={userProfile.avatar || '/userimg.png'}
                                alt={`${userProfile.username}'s avatar`}
                                className="rounded-full border-4 border-pawn shadow-2xl shadow-pawn/40 group-hover:shadow-pawn/70 group-hover:ring-2 group-hover:scale-105 hover:ring-pawn/50 transition-all duration-200 mb-3"
                                width={110}
                                height={110}
                                loading="eager"
                            />
                        </Link>
                        <div className="flex items-center gap-2 mb-1">
                            <Link href={userProfile.url}>
                                <h2 className="text-2xl font-bold tracking-wide hover:text-pawn transition">
                                    {userProfile.username}
                                </h2>
                            </Link>
                            {userProfile.verified && (
                                <span className="text-blue-400 text-lg" title="Verified">
                                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="inline"><circle cx="10" cy="10" r="10" fill="#66c2ff" /><path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </span>
                            )}
                        </div>
                        {userProfile.league && (
                            <span className="px-4 py-1 bg-pawn/20 text-pawn rounded-full text-xs font-semibold mb-1 border border-pawn/30 shadow-pawn/10 shadow">
                                {userProfile.league}
                            </span>
                        )}
                        {userProfile.is_streamer && (
                            <span className="px-4 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs border border-purple-500/40 shadow-purple-500/20 shadow">
                                <span className="mr-1 animate-pulse text-purple-500">●</span>Streamer
                            </span>
                        )}
                    </div>

                    <div className="bg-gradient-to-r from-transparent via-gray-600/30 to-transparent h-[1px] w-full mb-5"></div>

                    {/* Profile Details */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Status:</span>
                            <span className="font-medium text-green-400 capitalize">{userProfile.status}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Followers:</span>
                            <span className="font-medium">{userProfile.followers.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Country:</span>
                            <span className="font-medium">{userProfile.location}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Joined:</span>
                            <span className="font-medium">
                                {new Date(userProfile.joined * 1000).toLocaleDateString('en-US', {
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-gray-400 text-sm">Last Online:</span>
                            <span className="font-medium">
                                {new Date(userProfile.last_online * 1000).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>

                    {userProfile.streaming_platforms && userProfile.streaming_platforms.length > 0 && (
                        <>
                            <div className="bg-gradient-to-r from-transparent via-gray-600/30 to-transparent h-[1px] w-full my-5"></div>
                            <div>
                                <h3 className="text-gray-400 text-xs uppercase font-semibold tracking-widest mb-2">Streaming On</h3>
                                <div className="flex flex-wrap gap-2">
                                    {userProfile.streaming_platforms.map((platform, idx) => (
                                        <span key={idx} className="px-2.5 py-1 bg-gray-800/70 rounded-full text-xs text-gray-50 border border-gray-700/30">{platform}</span>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
})

export default ProfileAside