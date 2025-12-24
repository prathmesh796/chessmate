import { useState, useEffect } from 'react'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, } from "@/components/ui/pagination"
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Game } from '@/types/types';
import { useRouter } from 'next/navigation';

const PreviousGames = ({ games }: { games: Game[] }) => {
    const router = useRouter();

    const [currentPage, setCurrentPage] = useState(1);
    const [selectedDate, setSelectedDate] = useState("");
    const [dates, setDates] = useState<string[]>([]);

    const limit = 10;
    const totalPages = Math.ceil(games.length / limit);
    const startIndex = (currentPage - 1) * limit;
    const currentGames = games ? games.slice().reverse().slice(startIndex, startIndex + limit) : [];

    const handlePrevious = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleReview = (pgn: string) => {
        //console.log("Reviewing PGN:", pgn);

        const onlyMoves = extractMoves(pgn);
        const encoded = btoa(onlyMoves);
        router.push(`/review?data=${encoded}`);
    };

    function extractMoves(pgn: string): string {
        return pgn
            .replace(/\[.*?\]\n?/g, "")        // remove all [Tags]
            .replace(/\{.*?\}/g, "")          // remove comments like {[%clk ...]}
            .replace(/\s+/g, " ")             // collapse spaces & newlines
            .trim();
    }

    return (
        <div>
            <div className="rounded-xl overflow-auto shadow border border-gray-700/20 bg-profile_bg/60">
                <table className="w-full text-white text-sm">
                    <thead>
                        <tr className="bg-profile_card/90">
                            <th className="p-3 text-left rounded-tl-xl font-semibold">Type</th>
                            <th className="p-3 text-left font-semibold">Players</th>
                            <th className="p-3 text-left font-semibold">Result</th>
                            <th className="p-3 text-left font-semibold">Date</th>
                            <th className="p-3 text-left rounded-tr-xl font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentGames.map((game, index) => (
                            <tr
                                key={index}
                                className="border-b border-gray-700/40 hover:bg-gradient-to-r hover:from-pawn/10 hover:to-transparent transition-all duration-150 group"
                            >
                                <td className="p-3">
                                    <Image
                                        src={
                                            game.time_class === 'rapid'
                                                ? '/rapid.png'
                                                : game.time_class === 'bullet'
                                                    ? '/bullet.png'
                                                    : '/blitz.png'
                                        }
                                        alt="game-type"
                                        width={28}
                                        height={28}
                                        className="rounded shadow-sm"
                                    />
                                </td>
                                <td className="p-3">
                                    <Link href={game.url} target="_blank" className="hover:underline hover:text-pawn transition-colors">
                                        {game.white.username}
                                        <span className="mx-1 text-gray-400/70">vs</span>
                                        {game.black.username}
                                    </Link>
                                </td>
                                <td className="p-3">
                                    <span className="font-semibold text-green-400">{game.white.result}</span>
                                    {" "}
                                    <span className="text-gray-300/70">-</span>
                                    {" "}
                                    <span className="font-semibold text-red-400">{game.black.result}</span>
                                </td>
                                <td className="p-3 text-gray-400">{new Date(game.end_time * 1000).toLocaleDateString()}</td>
                                <td className="p-3">
                                    <Button className="bg-gradient-to-r from-pawn to-[#9bc16a] hover:from-[#9bc16a] hover:to-pawn shadow-lg hover:shadow-pawn/40 transition-all border-none outline-none text-xs px-4 py-2 font-medium rounded-md" onClick={() => handleReview(game.pgn)}>
                                        Review
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end mt-4">
                <Pagination>
                    <PaginationPrevious onClick={() => currentPage > 1 && handlePrevious()}>
                        <PaginationLink>Previous</PaginationLink>
                    </PaginationPrevious>
                    <PaginationContent>
                        {Array.from({ length: totalPages }, (_, index) => (
                            <PaginationItem
                                key={index + 1}
                                onClick={() => handlePageChange(index + 1)}
                                className={currentPage === index + 1 ? 'bg-pawn/40 rounded' : ''}
                            >
                                <PaginationLink>{index + 1}</PaginationLink>
                            </PaginationItem>
                        ))}
                    </PaginationContent>
                    <PaginationNext onClick={() => currentPage < totalPages && handleNext()}>
                        <PaginationLink>Next</PaginationLink>
                    </PaginationNext>
                </Pagination>
            </div>
        </div>
    )
}

export default PreviousGames