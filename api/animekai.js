export default async function handler(req, res) {
    try {
        const response = await fetch(`https://animekai.bz/api/user/${process.env.ANIMEKAI_USERNAME}/watchlist`);
        const data = await response.json();

        if (!data || data.length === 0) {
            return res.status(200).json({ message: "No anime's detected." });
        }

        const currentlyWatching = data.map(item => ({
            title: item.title,
            image: item.image_url
        }));

        res.status(200).json(currentlyWatching);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch AnimeKai watchlist." });
    }
}
