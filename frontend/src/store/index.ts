import { createStore } from 'vuex'
const themes = {
  namespaced: true,
  state: () => ({
    themes: ["light","dark","nerv"],
    current_theme: undefined,
  }),
  mutations: {
    select_theme(state: any, themename: any){
      state.current_theme = themename;
    },
  },
  actions: {
  },
  getters: {
  }
}
const radioiddotnet = {
  namespaced: true,
  state: () => ({
  }),
  mutations: {
  },
  actions: {
  },
  getters: {
  }
}
const firmwares = {
  namespaced: true,
  state: () => ({
    loaded_firmwares: [],
  }),
  mutations: {
    add_firmwares(state: any, firmwares: any){
      console.log(`add_firmware()`);
      for( const fw of firmwares ){
        state.loaded_firmwares.push(fw);
      }
    },
    clear_firmwares(state: any, idx: number ){
      console.log(`clear_firmwares()`);
      state.current_firmware = undefined;
      state.loaded_firmwares = [];
    }
  },
  actions: {
  },
  getters: {
  }
}
const codeplugs = {
  namespaced: true,
  state: () => ({
    loaded_codeplugs: [],
    current_codeplug: undefined,
    definitions: {},
    current_definition: {},
  }),
  mutations: {
    set_definitions(state: any, defs: any ){
      state.definitions = defs;
    },
    add_codeplug(state: any, codeplug: any){
      console.log(`add_codeplug()`);
      state.loaded_codeplugs.push(codeplug);
    },
    delete_codeplug(state: any, idx: number){
      console.log(`delete_codeplug(${idx})`);
      if( state.current_codeplug == state.loaded_codeplugs[idx] ){
        state.current_codeplug = undefined;
      }
      state.loaded_codeplugs.splice(idx,1);
    },
    select_codeplug(state: any, idx: number ){
      console.log(`select_codeplug(${idx})`);
      state.current_codeplug = state.loaded_codeplugs[ idx ];
    },
    clear_codeplugs(state: any, idx: number ){
      console.log(`clear_codeplugs()`);
      state.current_codeplug = undefined;
      state.loaded_codeplugs = [];
    }
  },
  actions: {
  },
  getters: {
  }
}
const devtools = {
  namespaced: true,
  state: () => ({
    devmode: false,
  }),
  mutations: {
    toggledevmode(state: any){
      state.devmode = !state.devmode;
      console.log("devmode=",state.devmode);
    },
  },
  actions: {
  },
  getters: {
  }
}
export default createStore({
  modules: {
    themes: themes,
    devtools: devtools,
    codeplugs: codeplugs,
    radioiddotnet: radioiddotnet,
    firmwares: firmwares,
  }
})
