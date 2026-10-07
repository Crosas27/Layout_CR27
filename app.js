import { init } from './js/app/init.js'
/* CR27 ENTRY POINT — source guide: CODE_MAP.md */
init().catch((error) => {
  const box = document.getElementById('errorBox')
  box.textContent = `CR27 could not start: ${error.message}`
  box.classList.remove('hidden')
})
