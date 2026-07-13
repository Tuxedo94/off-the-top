# Off the Top — Freestyle Rhyme Book

Learn freestyle rap from A to Z: an 8-lesson curriculum, a practice booth with a
boom-bap beat and random word/topic drops, a 30-second rhyme lab, and a recorded
take log — transcribed live and judged by the Freestyle God.

Built with React + Tone.js. Recordings, transcripts and progress are stored
locally in your browser (IndexedDB). To enable the Freestyle God's judgments,
add your own Anthropic API key under ⚙ God settings in The Log tab.

Source lives in `src/`; the deployed bundle is `assets/app.js`. Rebuild with:

    npm install
    npx esbuild src/main.jsx --bundle --minify --loader:.jsx=jsx \
      --define:process.env.NODE_ENV='"production"' --outfile=assets/app.js
