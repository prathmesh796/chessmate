import { Chess } from 'chess.js'
import ChessBoard from '@/components/ChessBoard';

export default async function Page({ params }: { params: Promise<{ FNG: string }> }) {
  const slug = (await params).FNG
  const FNG = `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2024.02.17"]
[White "prathmesh796"]
[Black "opponent"]
[Result "1-0"]
1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 c5 13. dxe5 dxe5 14. Nf1 Qc7 15. Ng3 Rfd8 16. Qe2 Nf8 17. Be3 Ng6 18. Rad1 Rxd1 19. Rxd1 Rd8 20. Rxd8+ Qxd8 21. a4 Qd7 22. axb5 axb5 23. Nd2 Bc6 24. f3 Qe6 25. Bb3 Qd7 26. Nf5 Bf8 27. Qf2 Nh5 28. Bxc5 Bxc5 29. Qxc5 Qxd2 30. Qxc6 Qe1+ 31. Kh2 h6 32. Qe8+ Kh7 33. Bxf7 1-0`;



  const chess = new Chess()
  const pgn = [
    '[Event "Casual Game"]',
    '[Site "Berlin GER"]',
    '[Date "1852.??.??"]',
    '[EventDate "?"]',
    '[Round "?"]',
    '[Result "1-0"]',
    '[White "Adolf Anderssen"]',
    '[Black "Jean Dufresne"]',
    '[ECO "C52"]',
    '[WhiteElo "?"]',
    '[BlackElo "?"]',
    '[PlyCount "47"]',
    '',
    '1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4 Bxb4 5.c3 Ba5 6.d4 exd4 7.O-O',
    'd3 8.Qb3 Qf6 9.e5 Qg6 10.Re1 Nge7 11.Ba3 b5 12.Qxb5 Rb8 13.Qa4',
    'Bb6 14.Nbd2 Bb7 15.Ne4 Qf5 16.Bxd3 Qh5 17.Nf6+ gxf6 18.exf6',
    'Rg8 19.Rad1 Qxf3 20.Rxe7+ Nxe7 21.Qxd7+ Kxd7 22.Bf5+ Ke8',
    '23.Bd7+ Kf8 24.Bxe7# 1-0',
  ]

  chess.loadPgn(pgn.join('\n'))

  chess.ascii()
  // -> '  +------------------------+
  //     8 | .  r  .  .  .  k  r  . |
  //     7 | p  b  p  B  B  p  .  p |
  //     6 | .  b  .  .  .  P  .  . |
  //     5 | .  .  .  .  .  .  .  . |
  //     4 | .  .  .  .  .  .  .  . |
  //     3 | .  .  P  .  .  q  .  . |
  //     2 | P  .  .  .  .  P  P  P |
  //     1 | .  .  .  R  .  .  K  . |
  //       +------------------------+
  //         a  b  c  d  e  f  g  h'

  console.log(chess.fen())

  return (
    <>
      <main>
        <h1>Review {slug}</h1>
        <ChessBoard pgn={chess.fen()} />
      </main>
    </>
  )
}