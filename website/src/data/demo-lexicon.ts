export type Pos = 'adj' | 'noun' | 'verb' | 'prep' | 'det' | 'conj' | 'adv' | 'pronoun';

export type DemoSense = {
  pos: string;
  posKey: Pos;
  gloss: string;
};

export type DemoEntry = {
  lemma: string;
  ipa: string;
  senses: DemoSense[];
};

const entries: Record<string, DemoEntry> = {
  a: {
    lemma: 'a',
    ipa: '/ə/',
    senses: [{ pos: 'determiner', posKey: 'det', gloss: 'The indefinite article; one, any, or each.' }],
  },
  and: {
    lemma: 'and',
    ipa: '/ænd/',
    senses: [{ pos: 'conjunction', posKey: 'conj', gloss: 'Connects words or clauses of the same rank.' }],
  },
  api: {
    lemma: 'API',
    ipa: '/ˌeɪpiːˈaɪ/',
    senses: [
      {
        pos: 'noun',
        posKey: 'noun',
        gloss: 'Application programming interface: a contract for talking to another program.',
      },
    ],
  },
  article: {
    lemma: 'article',
    ipa: '/ˈɑːtɪkəl/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'A piece of writing; also a grammar word such as the or a.' }],
  },
  beside: {
    lemma: 'beside',
    ipa: '/bɪˈsaɪd/',
    senses: [{ pos: 'preposition', posKey: 'prep', gloss: 'At the side of; next to.' }],
  },
  breaker: {
    lemma: 'breaker',
    ipa: '/ˈbreɪkə/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'Something that interrupts a circuit, literal or figurative.' }],
  },
  bubble: {
    lemma: 'bubble',
    ipa: '/ˈbʌbəl/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'Here: the on-page card that holds a definition.' }],
  },
  cached: {
    lemma: 'cached',
    ipa: '/kæʃt/',
    senses: [{ pos: 'adjective', posKey: 'adj', gloss: 'Stored locally so a later lookup need not hit the network.' }],
  },
  cannot: {
    lemma: 'cannot',
    ipa: '/ˈkænɒt/',
    senses: [{ pos: 'verb', posKey: 'verb', gloss: 'Am, is, or are not able to.' }],
  },
  circuit: {
    lemma: 'circuit',
    ipa: '/ˈsɜːkɪt/',
    senses: [
      {
        pos: 'noun',
        posKey: 'noun',
        gloss: 'A closed path. A circuit breaker stops a failing provider from being called again too soon.',
      },
    ],
  },
  click: {
    lemma: 'click',
    ipa: '/klɪk/',
    senses: [
      { pos: 'noun', posKey: 'noun', gloss: 'A press of a mouse button or trackpad.' },
      { pos: 'verb', posKey: 'verb', gloss: 'To press a control. The extension listens for a double-click.' },
    ],
  },
  closed: {
    lemma: 'closed',
    ipa: '/kləʊzd/',
    senses: [{ pos: 'adjective', posKey: 'adj', gloss: 'Not open; here, a Shadow DOM that page CSS cannot restyle.' }],
  },
  dictionary: {
    lemma: 'dictionary',
    ipa: '/ˈdɪkʃənəri/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'A list of words with meanings, sounds, and grammar notes.' }],
  },
  dom: {
    lemma: 'DOM',
    ipa: '/dɒm/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'Document Object Model: the tree of nodes that makes up a page.' }],
  },
  double: {
    lemma: 'double',
    ipa: '/ˈdʌbəl/',
    senses: [{ pos: 'adjective', posKey: 'adj', gloss: 'Twofold. A double-click is two clicks in quick succession.' }],
  },
  egress: {
    lemma: 'egress',
    ipa: '/ˈiːɡres/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'The act of leaving. A new tab is egress from the page you were reading.' }],
  },
  extension: {
    lemma: 'extension',
    ipa: '/ɪkˈstenʃən/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'A small program that adds behavior to the browser.' }],
  },
  fail: {
    lemma: 'fail',
    ipa: '/feɪl/',
    senses: [{ pos: 'verb', posKey: 'verb', gloss: 'To be unsuccessful. Providers fail over to the next source in the chain.' }],
  },
  gloss: {
    lemma: 'gloss',
    ipa: '/ɡlɒs/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'A short explanation of a word, usually beside the text.' }],
  },
  in: {
    lemma: 'in',
    ipa: '/ɪn/',
    senses: [{ pos: 'preposition', posKey: 'prep', gloss: 'Inside or during. In situ means in the original place.' }],
  },
  indexeddb: {
    lemma: 'IndexedDB',
    ipa: '/ˈɪndekst diːbiː/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'A browser database. The extension caches lemmas you already looked up.' }],
  },
  interpolates: {
    lemma: 'interpolate',
    ipa: '/ɪnˈtɜːpəleɪt/',
    senses: [{ pos: 'verb', posKey: 'verb', gloss: 'To insert something into the middle of a sequence. The bubble is interpolated beside the word.' }],
  },
  interpolate: {
    lemma: 'interpolate',
    ipa: '/ɪnˈtɜːpəleɪt/',
    senses: [{ pos: 'verb', posKey: 'verb', gloss: 'To insert something into the middle of a sequence.' }],
  },
  is: {
    lemma: 'is',
    ipa: '/ɪz/',
    senses: [{ pos: 'verb', posKey: 'verb', gloss: 'Third-person singular of be.' }],
  },
  it: {
    lemma: 'it',
    ipa: '/ɪt/',
    senses: [{ pos: 'pronoun', posKey: 'pronoun', gloss: 'The thing just named, or a dummy subject.' }],
  },
  keeps: {
    lemma: 'keep',
    ipa: '/kiːp/',
    senses: [{ pos: 'verb', posKey: 'verb', gloss: 'To retain or continue. The article keeps the viewport during a lookup.' }],
  },
  lemma: {
    lemma: 'lemma',
    ipa: '/ˈlemə/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'The dictionary form of a word, used as the headword of an entry.' }],
  },
  lookup: {
    lemma: 'lookup',
    ipa: '/ˈlʊkʌp/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'The act of finding a word in a dictionary.' }],
  },
  lookups: {
    lemma: 'lookup',
    ipa: '/ˈlʊkʌp/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'Dictionary requests. Dictionary on Click lookups stay on the page.' }],
  },
  never: {
    lemma: 'never',
    ipa: '/ˈnevə/',
    senses: [{ pos: 'adverb', posKey: 'adv', gloss: 'At no time; not ever.' }],
  },
  no: {
    lemma: 'no',
    ipa: '/nəʊ/',
    senses: [{ pos: 'determiner', posKey: 'det', gloss: 'Not any. Used here as a blunt refusal: no remote telemetry.' }],
  },
  of: {
    lemma: 'of',
    ipa: '/əv/',
    senses: [{ pos: 'preposition', posKey: 'prep', gloss: 'Expresses belonging, origin, or the object of a noun.' }],
  },
  on: {
    lemma: 'on',
    ipa: '/ɒn/',
    senses: [{ pos: 'preposition', posKey: 'prep', gloss: 'In contact with a surface; also used in the product name.' }],
  },
  over: {
    lemma: 'over',
    ipa: '/ˈəʊvə/',
    senses: [{ pos: 'adverb', posKey: 'adv', gloss: 'Across to another. Fail over: switch to the next provider.' }],
  },
  page: {
    lemma: 'page',
    ipa: '/peɪdʒ/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'A document in the browser. Lookups stay on this page.' }],
  },
  part: {
    lemma: 'part',
    ipa: '/pɑːt/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'A piece of a whole. Part of speech is the grammar class of a word.' }],
  },
  pierce: {
    lemma: 'pierce',
    ipa: '/pɪəs/',
    senses: [{ pos: 'verb', posKey: 'verb', gloss: 'To pass through. Hostile page CSS cannot pierce a closed shadow root.' }],
  },
  pronunciation: {
    lemma: 'pronunciation',
    ipa: '/prəˌnʌnsiˈeɪʃən/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'How a word is spoken. The bubble can show IPA and play audio in the real extension.' }],
  },
  providers: {
    lemma: 'provider',
    ipa: '/prəˈvaɪdə/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'A dictionary source. The extension chains Wiktionary and other free APIs.' }],
  },
  provider: {
    lemma: 'provider',
    ipa: '/prəˈvaɪdə/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'A dictionary source in the fallback chain.' }],
  },
  recalcitrant: {
    lemma: 'recalcitrant',
    ipa: '/rɪˈkælsɪtrənt/',
    senses: [{ pos: 'adjective', posKey: 'adj', gloss: 'Stubbornly uncooperative. A recalcitrant API keeps failing.' }],
  },
  remote: {
    lemma: 'remote',
    ipa: '/rɪˈməʊt/',
    senses: [{ pos: 'adjective', posKey: 'adj', gloss: 'Off-device. The extension does not send remote telemetry.' }],
  },
  ritual: {
    lemma: 'ritual',
    ipa: '/ˈrɪtʃuəl/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'A set sequence of acts. Here, double-click is the whole ritual.' }],
  },
  root: {
    lemma: 'root',
    ipa: '/ruːt/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'The origin node of a tree. A shadow root isolates the bubble from the page.' }],
  },
  sequence: {
    lemma: 'sequence',
    ipa: '/ˈsiːkwəns/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'An ordered series. Providers are tried in sequence.' }],
  },
  serves: {
    lemma: 'serve',
    ipa: '/sɜːv/',
    senses: [{ pos: 'verb', posKey: 'verb', gloss: 'To supply. IndexedDB serves a cached lemma when the network is down.' }],
  },
  sesquipedalian: {
    lemma: 'sesquipedalian',
    ipa: '/ˌsɛskwɪpɪˈdeɪliən/',
    senses: [
      { pos: 'adjective', posKey: 'adj', gloss: 'Given to using long words; (of a word) polysyllabic.' },
      { pos: 'noun', posKey: 'noun', gloss: 'A long, often obscure word; a lexical extravagance.' },
    ],
  },
  shadow: {
    lemma: 'shadow',
    ipa: '/ˈʃædəʊ/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'In browsers, shadow means an isolated DOM tree attached to an element.' }],
  },
  sits: {
    lemma: 'sit',
    ipa: '/sɪt/',
    senses: [{ pos: 'verb', posKey: 'verb', gloss: 'To rest in place. The gloss sits on top of the article.' }],
  },
  situ: {
    lemma: 'situ',
    ipa: '/ˈsɪtjuː/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'Latin place. In situ: in the original position, not in a new tab.' }],
  },
  so: {
    lemma: 'so',
    ipa: '/səʊ/',
    senses: [{ pos: 'conjunction', posKey: 'conj', gloss: 'And therefore; with the result that.' }],
  },
  speech: {
    lemma: 'speech',
    ipa: '/spiːtʃ/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'Spoken language. Part of speech is noun, verb, adjective, and the rest.' }],
  },
  stay: {
    lemma: 'stay',
    ipa: '/steɪ/',
    senses: [{ pos: 'verb', posKey: 'verb', gloss: 'To remain. Definitions stay beside the lemma.' }],
  },
  styles: {
    lemma: 'style',
    ipa: '/staɪl/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'CSS rules on the host page. They cannot restyle a closed shadow tree.' }],
  },
  telemetry: {
    lemma: 'telemetry',
    ipa: '/təˈlemɪtri/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'Remote measurement and tracking. This product ships none.' }],
  },
  terse: {
    lemma: 'terse',
    ipa: '/tɜːs/',
    senses: [{ pos: 'adjective', posKey: 'adj', gloss: 'Brief and compressed, without spare words.' }],
  },
  the: {
    lemma: 'the',
    ipa: '/ðə/',
    senses: [{ pos: 'determiner', posKey: 'det', gloss: 'The definite article; names a particular thing.' }],
  },
  then: {
    lemma: 'then',
    ipa: '/ðen/',
    senses: [{ pos: 'adverb', posKey: 'adv', gloss: 'Next in time or sequence.' }],
  },
  there: {
    lemma: 'there',
    ipa: '/ðeə/',
    senses: [{ pos: 'adverb', posKey: 'adv', gloss: 'In that place; also a dummy subject in there is.' }],
  },
  trips: {
    lemma: 'trip',
    ipa: '/trɪp/',
    senses: [{ pos: 'verb', posKey: 'verb', gloss: 'To trigger a protective switch. A failing API trips the circuit breaker.' }],
  },
  vacuous: {
    lemma: 'vacuous',
    ipa: '/ˈvækjuəs/',
    senses: [{ pos: 'adjective', posKey: 'adj', gloss: 'Empty of content. The cache exists so the bubble is never vacuous.' }],
  },
  viewport: {
    lemma: 'viewport',
    ipa: '/ˈvjuːpɔːt/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'The visible window of the page. A lookup should not steal it.' }],
  },
  while: {
    lemma: 'while',
    ipa: '/waɪl/',
    senses: [{ pos: 'conjunction', posKey: 'conj', gloss: 'During the time that; whereas.' }],
  },
  whole: {
    lemma: 'whole',
    ipa: '/həʊl/',
    senses: [{ pos: 'adjective', posKey: 'adj', gloss: 'Entire; complete. Double-click is the whole ritual.' }],
  },
  top: {
    lemma: 'top',
    ipa: '/tɒp/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'The highest surface. The bubble sits on top of the article.' }],
  },
  addons: {
    lemma: 'addons',
    ipa: '/ˈædɒnz/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'Firefox Add-ons: Mozilla\'s store for browser extensions.' }],
  },
  any: {
    lemma: 'any',
    ipa: '/ˈeni/',
    senses: [{ pos: 'determiner', posKey: 'det', gloss: 'One or some, no matter which. Double-click any word on the page.' }],
  },
  caches: {
    lemma: 'cache',
    ipa: '/kæʃ/',
    senses: [{ pos: 'verb', posKey: 'verb', gloss: 'To store for later. IndexedDB caches lemmas you already looked up.' }],
  },
  chain: {
    lemma: 'chain',
    ipa: '/tʃeɪn/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'A series of links. Dictionary on Click tries providers in a fallback chain.' }],
  },
  chrome: {
    lemma: 'Chrome',
    ipa: '/krəʊm/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'Google\'s browser. Dictionary on Click supports Chrome 120 and newer.' }],
  },
  definition: {
    lemma: 'definition',
    ipa: '/ˌdefɪˈnɪʃən/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'A statement of what a word means. The bubble shows a short definition.' }],
  },
  even: {
    lemma: 'even',
    ipa: '/ˈiːvən/',
    senses: [{ pos: 'adverb', posKey: 'adv', gloss: 'Used to stress something unexpected. Even a long word can be looked up in place.' }],
  },
  fallback: {
    lemma: 'fallback',
    ipa: '/ˈfɔːlbæk/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'A reserve option if the first one fails. Wiktionary is first, then other APIs.' }],
  },
  firefox: {
    lemma: 'Firefox',
    ipa: '/ˈfaɪəfɒks/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'Mozilla\'s browser. Dictionary on Click supports Firefox 142 and newer.' }],
  },
  for: {
    lemma: 'for',
    ipa: '/fɔː/',
    senses: [{ pos: 'preposition', posKey: 'prep', gloss: 'Intended to belong to or suit. A definition for the selected word.' }],
  },
  free: {
    lemma: 'free',
    ipa: '/friː/',
    senses: [{ pos: 'adjective', posKey: 'adj', gloss: 'Costing nothing. Dictionary on Click is free and does not need an API key.' }],
  },
  from: {
    lemma: 'from',
    ipa: '/frɒm/',
    senses: [{ pos: 'preposition', posKey: 'prep', gloss: 'Indicating the source. Install from Firefox Add-ons or the Chrome Web Store.' }],
  },
  install: {
    lemma: 'install',
    ipa: '/ɪnˈstɔːl/',
    senses: [{ pos: 'verb', posKey: 'verb', gloss: 'To add software to a device. Install Dictionary on Click from the browser stores.' }],
  },
  key: {
    lemma: 'key',
    ipa: '/kiː/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'A secret token for an API. This extension does not ask you for one.' }],
  },
  leave: {
    lemma: 'leave',
    ipa: '/liːv/',
    senses: [{ pos: 'verb', posKey: 'verb', gloss: 'To go away from. Lookups should not make you leave the page.' }],
  },
  new: {
    lemma: 'new',
    ipa: '/njuː/',
    senses: [{ pos: 'adjective', posKey: 'adj', gloss: 'Not existing before. A new tab would break reading flow.' }],
  },
  one: {
    lemma: 'one',
    ipa: '/wʌn/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'A single thing. Even a long word is still one lookup.' }],
  },
  or: {
    lemma: 'or',
    ipa: '/ɔː/',
    senses: [{ pos: 'conjunction', posKey: 'conj', gloss: 'Marks an alternative. Firefox or Chrome.' }],
  },
  other: {
    lemma: 'other',
    ipa: '/ˈʌðə/',
    senses: [{ pos: 'adjective', posKey: 'adj', gloss: 'Further or different. Other free providers sit behind Wiktionary.' }],
  },
  store: {
    lemma: 'store',
    ipa: '/stɔː/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'A catalog of apps. The Chrome Web Store lists Dictionary on Click.' }],
  },
  tab: {
    lemma: 'tab',
    ipa: '/tæb/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'A browser page slot. The extension avoids sending you to a new tab.' }],
  },
  use: {
    lemma: 'use',
    ipa: '/juːz/',
    senses: [{ pos: 'verb', posKey: 'verb', gloss: 'To employ. Lookups use Wiktionary first.' }],
  },
  web: {
    lemma: 'web',
    ipa: '/web/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'The World Wide Web. Chrome Web Store is Google\'s extension catalog.' }],
  },
  wiktionary: {
    lemma: 'Wiktionary',
    ipa: '/ˈwɪkʃənəri/',
    senses: [
      {
        pos: 'noun', posKey: 'noun',
        gloss: 'A free wiki dictionary. Dictionary on Click queries it first, under CC BY-SA terms.',
      },
    ],
  },
  word: {
    lemma: 'word',
    ipa: '/wɜːd/',
    senses: [{ pos: 'noun', posKey: 'noun', gloss: 'A unit of language. Double-click a word to look it up.' }],
  },
  you: {
    lemma: 'you',
    ipa: '/juː/',
    senses: [{ pos: 'pronoun', posKey: 'pronoun', gloss: 'The person addressed. You stay on the page while the bubble opens.' }],
  },
};

export type DemoToken = { kind: 'word'; key: string; display: string } | { kind: 'text'; display: string };

export function tokenizeDemo(text: string): DemoToken[] {
  const tokens: DemoToken[] = [];
  const re = /([A-Za-z][A-Za-z0-9]*)|([^A-Za-z]+)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    if (match[1]) {
      tokens.push({ kind: 'word', key: match[1].toLowerCase(), display: match[1] });
    } else {
      tokens.push({ kind: 'text', display: match[2] });
    }
  }
  return tokens;
}

export function lookupDemo(key: string): DemoEntry {
  const hit = entries[key.toLowerCase()];
  if (hit) return hit;
  return {
    lemma: key,
    ipa: '',
    senses: [
      {
        pos: 'demo',
        posKey: 'noun',
        gloss: 'This window only defines the words in the sample. The real extension looks up any word on a page.',
      },
    ],
  };
}
