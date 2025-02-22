import ChessBoard from "@/components/ChessBoard";

export default async function Page({ params }: { params: Promise<{ game: string }> }) {
  const slug = (await params).game
  const pgn = `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2024.02.17"]
[White "prathmesh796"]
[Black "opponent"]
[Result "1-0"]
1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 c5 13. dxe5 dxe5 14. Nf1 Qc7 15. Ng3 Rfd8 16. Qe2 Nf8 17. Be3 Ng6 18. Rad1 Rxd1 19. Rxd1 Rd8 20. Rxd8+ Qxd8 21. a4 Qd7 22. axb5 axb5 23. Nd2 Bc6 24. f3 Qe6 25. Bb3 Qd7 26. Nf5 Bf8 27. Qf2 Nh5 28. Bxc5 Bxc5 29. Qxc5 Qxd2 30. Qxc6 Qe1+ 31. Kh2 h6 32. Qe8+ Kh7 33. Bxf7 1-0`;

  return (
    <>
      <main>
        <h1>Review {slug}</h1>
        <ChessBoard pgn={pgn}/>
      </main>
    </>
  )
}