// Importiamo i modelli di cui abbiamo bisogno
const WatchedEntry = require('../models/watchedEntryModel');
const User = require('../models/userModel');

// --- Funzione per AGGIUNGERE un film alla lista dei visti ---
// Rotta protetta: solo l'utente loggato può aggiungere film alla PROPRIA lista.
exports.addWatchedEntry = async (req, res) => {
    try {
        // Prendiamo l'ID dell'utente dal token JWT (grazie al middleware)
        const userId = req.user._id;

        // Prendiamo i dati del film dal corpo della richiesta inviata dal frontend
        const { tmdbId, title, posterPath, watchDate, rating, review } = req.body;

        // Creiamo la nuova voce per la libreria
        const newEntry = new WatchedEntry({
            userId,
            tmdbId,
            title,
            posterPath,
            watchDate,
            rating,
            review
        });

        // Salviamo la nuova voce nel database
        await newEntry.save();

        res.status(201).json({ message: "Film aggiunto alla lista!", entry: newEntry });

    } catch (error) {
        // Se l'utente prova ad aggiungere un film che ha già (grazie all'indice unico che abbiamo creato)
        if (error.code === 11000) {
            return res.status(409).json({ error: "Questo film è già nella tua lista." });
        }
        res.status(500).json({ error: "Errore nell'aggiungere il film: " + error.message });
    }
};

// --- Funzione per RECUPERARE la lista dei film visti di un utente ---
// Rotta pubblica: chiunque può vedere la lista di film di un altro utente.
exports.getWatchedEntries = async (req, res) => {
    try {
        // Troviamo l'utente in base allo username passato nell'URL (es. /api/watched/mario.rossi)
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ error: "Utente non trovato." });
        }

        // Cerchiamo tutte le voci nella collezione WatchedEntry che appartengono a quell'utente
        const watchedList = await WatchedEntry.find({ userId: user._id })
            .sort({ watchDate: -1 }); // Ordiniamo per data di visione più recente

        res.status(200).json(watchedList);

    } catch (error) {
        res.status(500).json({ error: "Errore nel recuperare la lista dei film: " + error.message });
    }
};