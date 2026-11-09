import { defineStore } from "pinia";
import { ref } from "vue";

export const usePruebasStores = defineStore("pruebas", ()=>{
    let token = ref("")

    function setToken(tk){
        console.log(tk);
        token.value = tk
    }

    return{
        token, setToken
    }
})