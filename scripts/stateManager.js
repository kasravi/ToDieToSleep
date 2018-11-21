class StateManager {
    
    getName(){
        return document.cookie['name'];
    }
    
    setName(name){
        if(!document.cookie) {document.cookie = {}}
        document.cookie['name'] = name;
    }

    getLevel(name){
        return document.cookie['level'] || 0;//TODO get from store
    }

    setLevel(name,level){
        if(!document.cookie) {document.cookie = {}}
        document.cookie['level'] = level;//TODO get from store
    }

    request(uri){

    }

    get(name){

    }

    update(name,level){

    }
}