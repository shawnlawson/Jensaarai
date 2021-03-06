'use babel'
import TouchDesignerView from './touch-designer-view'
import TidalCyclesView from './tidalcycles-view'
import Repl from './repl'
import Ghc from './ghc';
import BootTidal from './boot-tidal';
import TD from './td'
import TR from './text-recording'
import TP from './text-playback'
import CC from './collaboration-connector'
import Cibo from './cibo'
import Evaluator from './evaluator'
import PlaybackStatusBar from './playback-status-bar'
import {CompositeDisposable} from 'atom'

export default {
  playbackBar: null,
  touchDesignerView: null,
  tidalCyclesView: null,
  tdRepl: null,
  tidalRepl: null,
  recording: null,
  playback: null,
  firebaseConnection: null,
  cibo: null,
  subscriptions: null,

  config: {
    'OSCServerPort': {
      type: 'integer',
      default: 8888,
      description: 'OSC Server Port'
    },
    'TouchDesignerPort': {
      type: 'integer',
      default: 9999,
      description: 'Touch Designer Client Port'
    },
    'TouchDesignerIP': {
      type: 'string',
      default: 'localhost',
      description: 'Touch Designer Client IP'
    },
    'interpreter': {
        type: 'string',
        default: 'default',
        enum: [
          { value: 'default', description: 'Default (ghc installed through cabal)'},
          { value: 'stack', description: 'Stack'},
          { value: 'nix', description: 'Nix'}
        ],
        order: 0
      },
    'ghciPath': {
      type: 'string',
      default: '',
      description: 'Haskell (ghci) path'
    },
    'bootTidalPath': {
      type: 'string',
      default: ''
    },
    'onlyShowLogWhenErrors': {
      type: 'boolean',
      default: false,
      description: 'Only show console if last message was an error.'
    },
    'onlyLogLastMessage': {
      type: 'boolean',
      default: false,
      description: 'Only log last message to the console.'
    },
    'filterPromptFromLogMessages': {
      type: 'boolean',
      default: true,
      description: 'Whether to filter out those long prompt comming from ghci.'
    },
    'autocomplete': {
      type: 'boolean',
      default: true,
      description: 'Autocomplete code'
    },
    'hooglePath': {
      type: 'string',
      default: 'hoogle',
      description: 'Path of hoogle command, needed for documentation on autocomplete'
    },
    'consolePrompt': {
        type: 'string',
        default: 't',
        description: `Console prompt. Look at the docs for available placeholders`,
        order: 50
    },
    'FirebaseServer': {
      type: 'string',
      default: 'ws://localhost:5555',
      description: 'Firebase Server with port '
    },
    'FirebaseUser': {
      type: 'string',
      default: '',
      description: 'Firebase User hint:email'
    },
    'FirebasePass': {
      type: 'string',
      default: '',
      description: 'Firebase Password'
    },
    'RemoteFirebaseKey': {
      type: 'string',
      default: '',
      description: 'Firebase API Key'
    },
    'RemoteFirebaseDomain': {
      type: 'string',
      default: '',
      description: 'Firebase Domain'
    },
    'RemoteFirebaseDBURL': {
      type: 'string',
      default: '',
      description: 'Firebase Database URL'
    },
    'CiboServerPort': {
      type: 'integer',
      default: 9898,
      description: 'Cibo Server Port'
    },
    'CiboClientPort': {
      type: 'integer',
      default: 8989,
      description: 'Cibo Client Port'
    },
    'CiboIP': {
      type: 'string',
      default: 'localhost',
      description: 'Cibo Client IP'
    },

  },

  activate(state) {
    this.evaluator = new Evaluator(this)

    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'jensaarai:start-tidal-cycles': () => this.startTidalCycles(state),
      'jensaarai:stop-tidal-cycles': () => this.stopTidalCycles(),
      'jensaarai:start-touch-designer': () => this.startTouchDesigner(state),
      'jensaarai:stop-touch-designer': () => this.stopTouchDesigner()
    }));

    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      'jensaarai:eval': () => this.evaluator.localEval('line'),
      'jensaarai:eval-multi-line': () => this.evaluator.localEval('multi_line'),
      'jensaarai:start-recording': () => this.recording = new TR(),
      'jensaarai:start-playback': () => this.playback = new TP(this),
      'jensaarai:start-cibo': () => this.cibo = new Cibo(this),
      'jensaarai:stop-cibo': () => {if(this.cibo !== null) this.cibo.destroy()},
      'firepad:local-connect': () => this.firebaseConnection = new CC(true, this),
      'firepad:remote-connect': () => this.firebaseConnection = new CC(false, this),
      'firepad:disconnect': () => {if(this.firebaseConnection !== null) this.firebaseConnection.destroy()}
    }))
  },

  startTouchDesigner(state) {
    this.touchDesignerView = new TouchDesignerView()
    this.touchDesignerView.initUI()
    this.tdRepl = new TD(this.touchDesignerView)
    this.tdRepl.init(this.evaluator)
  },

  stopTouchDesigner() {
    this.touchDesignerView.destroy()
    this.tdRepl.destroy()
  },

  startTidalCycles(state) {
    this.tidalCyclesView = new TidalCyclesView()
    this.tidalCyclesView.initUI()
    this.ghc = new Ghc(this.tidalCyclesView);
    this.ghc.init();
    this.bootTidal = new BootTidal(this.ghc, atom.project.rootDirectories);
    this.tidalRepl = new Repl(this.tidalCyclesView, this.ghc, this.bootTidal);
  },

  stopTidalCycles() {
    this.tidalCyclesView.destroy()
    this.tidalRepl.destroy()
  },

  async consumeStatusBar (statusBar) {
    this.playbackBar = new PlaybackStatusBar({
      statusBar
    })
    this.playbackBar.attach()
  },

  deactivate() {
    this.subscriptions.dispose()
    stopTouchDesigner()
    stopTidalCycles()
    if (this.recording !== null) this.recording.destroy()
    if (this.playback !== null) this.playback.destroy()
    if (this.cibo !== null) this.cibo.destroy()
    if (this.firebaseConnection !== null) this.firebaseConnection.destroy()
    if (this.playbackBar) this.playbackBar.destroy()
  },

  serialize() {
    // return {
    //   tidalCyclesViewState: this.tidalCyclesView.serialize()
    //   touchDesignerViewState: this.touchDesignerView.serialize()
    // }
  },

};
