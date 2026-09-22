// State management
let allPosts = [];
let filteredPosts = [];
let displayedCount = 0;
const PAGE_SIZE = 3;
let currentCategory = 'all';
let searchQuery = '';

// Category styling map
const categoryStyles = {
  'Biochemistry': {
    badgeColor: 'text-amber-400',
    borderColor: 'border-amber-500',
    labelColor: 'text-amber-400',
    bookColor: 'text-amber-400 hover:text-amber-300'
  },
  'EvolutionaryBiology': {
    badgeColor: 'text-cyan-400',
    borderColor: 'border-cyan-500',
    labelColor: 'text-cyan-400',
    bookColor: 'text-cyan-400 hover:text-cyan-300'
  },
  'SomaticInterventions': {
    badgeColor: 'text-emerald-400',
    borderColor: 'border-emerald-500',
    labelColor: 'text-emerald-400',
    bookColor: 'text-emerald-400 hover:text-emerald-300'
  },
  'Neuroplasticity': {
    badgeColor: 'text-purple-400',
    borderColor: 'border-purple-500',
    labelColor: 'text-purple-400',
    bookColor: 'text-purple-400 hover:text-purple-300'
  },
  'SocialLineage': {
    badgeColor: 'text-rose-400',
    borderColor: 'border-rose-500',
    labelColor: 'text-rose-400',
    bookColor: 'text-rose-400 hover:text-rose-300'
  }
};

// DOM Elements
const postsContainer = document.getElementById('posts-container');
const sentinel = document.getElementById('scroll-sentinel');
const loadingSpinner = document.getElementById('loading-spinner');
const endOfFeed = document.getElementById('end-of-feed');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const pills = document.querySelectorAll('.cat-pill');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const leadMagnetBar = document.getElementById('lead-magnet-bar');
const dismissLeadBar = document.getElementById('dismiss-lead-bar');
const filterStatus = document.getElementById('filter-status');
const filterStatusText = document.getElementById('filter-status-text');
const resetFilterBtn = document.getElementById('reset-filter-btn');

// Toast helper
function showToast(msg) {
  toastMessage.textContent = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none');
  toast.classList.add('opacity-100');
  setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none');
    toast.classList.remove('opacity-100');
  }, 2600);
}

// Lead Magnet dismissal
dismissLeadBar.addEventListener('click', () => {
  leadMagnetBar.classList.add('translate-y-full');
  sessionStorage.setItem('lead_magnet_dismissed', 'true');
});
if (sessionStorage.getItem('lead_magnet_dismissed') === 'true') {
  leadMagnetBar.classList.add('translate-y-full');
}

// Initialize feed
async function initFeed() {
  try {
    const response = await fetch('posts.json');
    if (!response.ok) throw new Error('Network response not ok');
    allPosts = await response.json();
  } catch (err) {
    console.warn('Falling back to embedded posts data:', err);
    allPosts = getEmbeddedFallbackPosts();
  }
  updateCategoryCounts();
  applyFilter();
  initIntersectionObserver();
}

function updateCategoryCounts() {
  const setCount = (id, count) => {
    const el = document.getElementById(id);
    if (el) el.textContent = count;
  };
  setCount('count-all', allPosts.length);
  setCount('count-biochem', allPosts.filter(p => p.category === 'Biochemistry').length);
  setCount('count-evobio', allPosts.filter(p => p.category === 'EvolutionaryBiology').length);
  setCount('count-somatic', allPosts.filter(p => p.category === 'SomaticInterventions').length);
  setCount('count-neuro', allPosts.filter(p => p.category === 'Neuroplasticity').length);
  setCount('count-social', allPosts.filter(p => p.category === 'SocialLineage').length);
}

function applyFilter() {
  filteredPosts = allPosts.filter(post => {
    const matchesCategory = currentCategory === 'all' || post.category === currentCategory;
    if (!matchesCategory) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      post.claim.toLowerCase().includes(q) ||
      post.proof.toLowerCase().includes(q) ||
      post.shift.toLowerCase().includes(q) ||
      (post.journal && post.journal.toLowerCase().includes(q)) ||
      (post.author && post.author.toLowerCase().includes(q)) ||
      (post.tags && post.tags.some(t => t.toLowerCase().includes(q))) ||
      (post.bookChapter && post.bookChapter.toLowerCase().includes(q))
    );
  });

  if (currentCategory !== 'all' || searchQuery) {
    filterStatus.classList.remove('hidden');
    filterStatusText.textContent = `Showing ${filteredPosts.length} paper${filteredPosts.length === 1 ? '' : 's'}${currentCategory !== 'all' ? ` in #${currentCategory}` : ''}${searchQuery ? ` matching "${searchQuery}"` : ''}`;
  } else {
    filterStatus.classList.add('hidden');
  }

  postsContainer.innerHTML = '';
  displayedCount = 0;
  loadMorePosts();
}

function loadMorePosts() {
  if (displayedCount >= filteredPosts.length) {
    loadingSpinner.classList.add('hidden');
    if (filteredPosts.length > 0) {
      endOfFeed.classList.remove('hidden');
    } else {
      endOfFeed.classList.add('hidden');
      postsContainer.innerHTML = `
        <div class="text-center py-12 border border-neutral-800 rounded-2xl bg-neutral-900/40 p-8">
          <p class="text-neutral-400 text-sm mb-2">No research papers match your current query.</p>
          <button onclick="resetFilters()" class="text-xs text-amber-400 font-semibold hover:underline">Clear search & filters</button>
        </div>
      `;
    }
    return;
  }

  loadingSpinner.classList.remove('hidden');
  endOfFeed.classList.add('hidden');

  const nextBatch = filteredPosts.slice(displayedCount, displayedCount + PAGE_SIZE);
  nextBatch.forEach(post => {
    const card = createCardElement(post);
    postsContainer.appendChild(card);
  });

  displayedCount += nextBatch.length;

  if (displayedCount >= filteredPosts.length) {
    loadingSpinner.classList.add('hidden');
    endOfFeed.classList.remove('hidden');
  }
}

function createCardElement(post) {
  const style = categoryStyles[post.category] || {
    badgeColor: 'text-amber-400',
    borderColor: 'border-amber-500',
    labelColor: 'text-amber-400',
    bookColor: 'text-amber-400 hover:text-amber-300'
  };

  const article = document.createElement('article');
  article.className = 'feed-card-anim bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xl hover:border-neutral-700 transition duration-200 group';
  article.id = post.id;

  article.innerHTML = `
    <div class="flex justify-between items-start text-xs text-neutral-400 mb-3">
      <div class="flex items-center space-x-2 flex-wrap">
        <span class="font-mono ${style.badgeColor} font-semibold uppercase tracking-wider">#${post.category}</span>
        <span>•</span>
        <span class="truncate max-w-[200px] sm:max-w-xs">${post.journal}</span>
      </div>
      <span class="text-neutral-500 font-mono text-[11px] shrink-0">${post.author ? post.author : ''} ${post.year ? `(${post.year})` : ''}</span>
    </div>

    <!-- The Hook Claim -->
    <h2 class="text-lg sm:text-xl font-bold text-neutral-100 leading-snug mb-3.5 group-hover:text-amber-200/90 transition-colors">
      ${post.claim}
    </h2>

    <!-- The Proof -->
    <p class="text-sm text-neutral-300 leading-relaxed mb-4 font-sans">
      ${post.proof}
    </p>

    <!-- The Practical Shift -->
    <div class="bg-neutral-950/80 border-l-2 ${style.borderColor} rounded-r-xl p-3.5 sm:p-4 mb-4 text-xs">
      <div class="flex items-center justify-between mb-1.5">
        <span class="font-semibold ${style.labelColor} uppercase tracking-wider font-mono text-[11px]">The Somatic Override:</span>
        <button onclick="copyReframe('${post.id}')" class="text-neutral-500 hover:text-neutral-300 flex items-center space-x-1 text-[11px] transition" title="Copy somatic practice">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
          <span>Copy</span>
        </button>
      </div>
      <p class="text-neutral-300 italic font-serif text-sm leading-relaxed" id="reframe-${post.id}">
        ${post.shift}
      </p>
    </div>

    <!-- Card Action / Attribution Footer -->
    <div class="flex items-center justify-between pt-3.5 border-t border-neutral-800/80 text-xs">
      <div class="flex items-center space-x-4">
        <a href="${post.doi}" target="_blank" rel="noopener noreferrer" class="text-neutral-400 hover:text-white flex items-center space-x-1.5 transition">
          <svg class="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          <span>View Clinical Paper</span>
        </a>
        <button onclick="sharePost('${post.id}')" class="text-neutral-400 hover:text-amber-300 flex items-center space-x-1.5 transition">
          <svg class="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
          <span>Share Insight</span>
        </button>
      </div>
      <a href="${post.bookLink || 'deep-dive.html'}" class="${style.bookColor} font-medium flex items-center space-x-1 transition">
        <span>${post.bookChapter}</span>
        <span>&rarr;</span>
      </a>
    </div>
  `;

  return article;
}

window.copyReframe = function(id) {
  const el = document.getElementById('reframe-' + id);
  if (el) {
    const text = el.innerText.trim();
    navigator.clipboard.writeText(text).then(() => {
      showToast('Somatic override copied to clipboard!');
    });
  }
};

window.sharePost = function(id) {
  const post = allPosts.find(p => p.id === id);
  if (!post) return;

  const shareText = `"${post.claim}"

Study: ${post.journal} (${post.year || ''})
Somatic Shift: ${post.shift}

Ghost Dogmas Evidence Feed:`;
  const shareUrl = window.location.origin + window.location.pathname + '#' + id;

  if (navigator.share) {
    navigator.share({
      title: post.claim,
      text: shareText,
      url: shareUrl
    }).catch(() => {});
  } else {
    navigator.clipboard.writeText(`${shareText}
${shareUrl}`).then(() => {
      showToast('Study & somatic practice copied for sharing!');
    });
  }
};

pills.forEach(pill => {
  pill.addEventListener('click', () => {
    pills.forEach(p => {
      p.classList.remove('active', 'bg-amber-500', 'text-neutral-950', 'font-bold');
      p.classList.add('bg-neutral-900', 'text-neutral-400', 'border-neutral-800');
    });
    pill.classList.add('active', 'bg-amber-500', 'text-neutral-950', 'font-bold');
    pill.classList.remove('bg-neutral-900', 'text-neutral-400', 'border-neutral-800');

    currentCategory = pill.dataset.cat;
    applyFilter();
  });
});

let searchDebounce;
searchInput.addEventListener('input', (e) => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    searchQuery = e.target.value.trim();
    if (searchQuery) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
    applyFilter();
  }, 200);
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  clearSearchBtn.classList.add('hidden');
  applyFilter();
});

window.resetFilters = function() {
  currentCategory = 'all';
  searchQuery = '';
  searchInput.value = '';
  clearSearchBtn.classList.add('hidden');
  
  pills.forEach(p => {
    if (p.dataset.cat === 'all') {
      p.classList.add('active', 'bg-amber-500', 'text-neutral-950', 'font-bold');
      p.classList.remove('bg-neutral-900', 'text-neutral-400');
    } else {
      p.classList.remove('active', 'bg-amber-500', 'text-neutral-950', 'font-bold');
      p.classList.add('bg-neutral-900', 'text-neutral-400');
    }
  });
  applyFilter();
};

resetFilterBtn.addEventListener('click', resetFilters);

function initIntersectionObserver() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && displayedCount < filteredPosts.length) {
        setTimeout(() => {
          loadMorePosts();
        }, 120);
      }
    });
  }, {
    rootMargin: '250px',
    threshold: 0.1
  });

  observer.observe(sentinel);
}

function getEmbeddedFallbackPosts() {
  return [
    {
      "id": "paper-001",
      "category": "Biochemistry",
      "journal": "JAMA Internal Medicine / Meta-Analysis",
      "author": "Helen Pilcher et al.",
      "year": "2024",
      "doi": "https://doi.org/10.1001/jamainternmed.2024.01",
      "claim": "Up to 97% of physical medication side effects are generated entirely by the brain's expectation of harm, not the drug itself.",
      "proof": "A meta-analysis across 230 clinical trials found that active chemical medications produced only a 3% increase in adverse reactions over placebos. Negative expectations trigger a flood of Cholecystokinin (CCK), an emergency biological switch that actively quashes natural endorphins and turns anticipatory dread into real, physical pain.",
      "shift": "When unearned rest or setting a boundary triggers gut tightness or throat constriction, label it accurately: 'This is not moral conviction or cosmic disfavor; this is an automated CCK nocebo reflex firing.'",
      "bookChapter": "Chapter 4: The Body Keeps the Dogma",
      "bookLink": "deep-dive.html#ch4",
      "tags": ["nocebo", "CCK", "endorphins", "side-effects"]
    },
    {
      "id": "paper-002",
      "category": "EvolutionaryBiology",
      "journal": "Frontiers in Psychology (Gothenburg)",
      "author": "Vickhoff et al.",
      "year": "2013",
      "doi": "https://doi.org/10.3389/fpsyg.2013.00334",
      "claim": "Choral singing and synchronized group chanting literally unify heart rates and vagal tone into a single biological rhythm.",
      "proof": "Biometric tracking of individuals singing structured hymns revealed that coordinated breathing immediately synchronized participants' Heart Rate Variability (HRV). The autonomic nervous system coregulates through physical, auditory, and respiratory unison—calming the amygdala independently of intellectual belief.",
      "shift": "Leaving high-demand religion strips away these vagal-soothing communal shields. You do not need dogma to access this medicine: group breathwork, secular choir, or shared vocalization provide the exact same biological calming effect.",
      "bookChapter": "Chapter 7: Reclaiming the Altar",
      "bookLink": "deep-dive.html#ch7",
      "tags": ["HRV", "vagus-nerve", "chanting", "coregulation"]
    },
    {
      "id": "paper-003",
      "category": "SomaticInterventions",
      "journal": "PLoS ONE (Harvard Medical)",
      "author": "Ted Kaptchuk et al.",
      "year": "2010",
      "doi": "https://doi.org/10.1371/journal.pone.0015591",
      "claim": "Sugar pills labeled 'PLACEBO' trigger significant biological healing even when patients are fully told they contain no medicine.",
      "proof": "In an open-label trial with chronic IBS patients, Harvard researchers discovered that receiving a placebo with complete scientific disclosure produced digestive healing and symptom relief on par with active pharmaceutical drugs. The body's predictive engine responds directly to the physical liturgy of care.",
      "shift": "Use Constructive Translation to build your own 'honest placebos.' Daily sensory rituals (morning coffee with intention, lighting a candle, physical posture) speak to the subconscious basement without needing supernatural certainty.",
      "bookChapter": "Chapter 7: Reclaiming the Altar",
      "bookLink": "deep-dive.html#ch7",
      "tags": ["placebo", "open-label", "liturgy", "IBS"]
    },
    {
      "id": "paper-004",
      "category": "Neuroplasticity",
      "journal": "JAMA Psychiatry",
      "author": "Alan Gordon et al.",
      "year": "2021",
      "doi": "https://doi.org/10.1001/jamapsychiatry.2021.2669",
      "claim": "66% of chronic back pain sufferers became pain-free after re-labeling physical sensations as false neural alarms rather than tissue damage.",
      "proof": "A landmark randomized clinical trial on Pain Reprocessing Therapy (PRT) showed that chronic back pain is frequently maintained by sensitized predictive threat loops rather than spinal pathology. fMRI scans confirmed that PRT shifted brain activity out of threat-processing centers into neutral somatosensory perception.",
      "shift": "When somatic flare-ups occur after challenging religious indoctrination or establishing boundaries, view the sensation with curiosity rather than terror: 'My tissue is intact. This is a false alarm in my nervous system's threat network.'",
      "bookChapter": "Chapter 4: The Body Keeps the Dogma",
      "bookLink": "deep-dive.html#ch4",
      "tags": ["pain-reprocessing", "fMRI", "chronic-pain", "neuroplasticity"]
    },
    {
      "id": "paper-005",
      "category": "EvolutionaryBiology",
      "journal": "Psychological Review (APA)",
      "author": "Steven Maier & Martin Seligman",
      "year": "2016",
      "doi": "https://doi.org/10.1037/rev0000033",
      "claim": "Helplessness is not learned—it is the brain's default mammalian reflex to prolonged stress; agency is what must be actively constructed.",
      "proof": "Fifty years after the original 'learned helplessness' experiments, optogenetic research revealed that the dorsal raphe nucleus automatically defaults to passive surrender when encountering uncontrollable stressors. Experiencing control requires prefrontal cortex (vmPFC) activation to inhibit the default panic circuit.",
      "shift": "If you feel frozen when contemplating major life changes outside your inherited community, realize: freeze is the ancient dorsal default, not a moral failure. Reclaim agency through small, undeniable micro-actions.",
      "bookChapter": "Chapter 2: The Evolutionary Altar",
      "bookLink": "deep-dive.html#ch2",
      "tags": ["learned-helplessness", "vmPFC", "agency", "dorsal-vagal"]
    },
    {
      "id": "paper-006",
      "category": "Biochemistry",
      "journal": "Psychological Assessment",
      "author": "Jeremy Clifton et al.",
      "year": "2019",
      "doi": "https://doi.org/10.1037/pas0000673",
      "claim": "Your subconscious operates on 3 primal world beliefs: whether the universe is Safe, Enticing, and Alive—formed before age six.",
      "proof": "Analysis of over 87,000 subjects across dozens of demographic groups identified that human perception is governed by underlying primary lenses. People who view the world as inherently dangerous exhibit chronic sympathetic activation, interpreting benign ambiguity as divine punishment or existential threat.",
      "shift": "Track which primal lens fires when you make a mistake: does your gut say 'the world is fundamentally hostile,' or 'I am a learning organism in an open system'? Consciously re-anchor into safety.",
      "bookChapter": "Chapter 3: The Deconstruction Dilemma",
      "bookLink": "deep-dive.html#ch3",
      "tags": ["primals", "worldview", "developmental", "safety"]
    },
    {
      "id": "paper-007",
      "category": "SocialLineage",
      "journal": "Evolution and Human Behavior",
      "author": "Dimitris Xygalatas et al.",
      "year": "2019",
      "doi": "https://doi.org/10.1016/j.evolhumbehav.2019.05.002",
      "claim": "High-arousal collective rituals release floods of beta-endorphins that bond groups tighter than intellectual consensus ever could.",
      "proof": "Field experiments monitoring physiological arousal during intense cultural rituals proved that synchronous physical exertion and shared emotional intensity trigger the brain's mu-opioid system, manufacturing unconditional social loyalty that bypasses critical reasoning faculties.",
      "shift": "Recognize that your lingering grief when leaving high-demand communities is biochemical withdrawal from synchronized opioid release. Rebuild deliberate somatic bonding through cooperative athletics, art, or secular communal meals.",
      "bookChapter": "Chapter 6: The Generational Ghost",
      "bookLink": "deep-dive.html#ch6",
      "tags": ["ritual", "endorphins", "tribal-bonding", "social-pack"]
    },
    {
      "id": "paper-008",
      "category": "Neuroplasticity",
      "journal": "The Believing Brain / Cognitive Neurosciences",
      "author": "Michael Gazzaniga & Michael Shermer",
      "year": "2011",
      "doi": "https://doi.org/10.1093/oxfordhb/9780199556700.013.0031",
      "claim": "The brain's Left-Hemisphere Interpreter manufactures post-hoc spiritual narratives to explain random autonomic gut spasms.",
      "proof": "Split-brain and neuroimaging investigations show that when autonomic or emotional surges occur without explicit conscious cause, the left hemisphere instantly confabulates a plausible narrative. In religious environments, autonomic unease is reflexively labeled 'conviction of the Holy Spirit' or 'spiritual warfare.'",
      "shift": "When an unexplainable wave of dread hits your chest, stop seeking a moral explanation. Say: 'That is my left-hemisphere interpreter trying to write a script for a cold draft, low blood sugar, or fatigue.'",
      "bookChapter": "Chapter 2: The Evolutionary Altar",
      "bookLink": "deep-dive.html#ch2",
      "tags": ["interpreter", "confabulation", "split-brain", "gut-brain"]
    },
    {
      "id": "paper-009",
      "category": "SomaticInterventions",
      "journal": "Nature Reviews Neuroscience",
      "author": "A.D. (Bud) Craig",
      "year": "2009",
      "doi": "https://doi.org/10.1038/nrn2555",
      "claim": "Interoceptive signals from the insular cortex precede conscious thoughts by up to 500 milliseconds.",
      "proof": "Functional mapping of the anterior insular cortex demonstrates that somatic feelings (heart rate, gut peristalsis, cutaneous temperature) reach awareness prior to conceptual appraisal. Rational beliefs are frequently retroactive justifications of pre-existing visceral states.",
      "shift": "Do not attempt to think your way out of a visceral fear state with theological debate. Address the insular baseline first: exhale slowly, relax the jaw, drop the shoulders, and signal physical safety to the autonomic basement.",
      "bookChapter": "Chapter 1: The Penthouse and the Basement",
      "bookLink": "deep-dive.html#ch1",
      "tags": ["interoception", "insula", "visceral", "gut-brain"]
    }
  ];
}

document.addEventListener('DOMContentLoaded', initFeed);
