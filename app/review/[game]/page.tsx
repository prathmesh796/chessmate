export default async function Page({ params }: { params: Promise<{ game: string }>}) {
    const slug = (await params).game
    return <div>My Post: {slug}</div>
  }