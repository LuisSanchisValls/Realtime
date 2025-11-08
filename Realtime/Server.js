const ws= require("ws");

const server = new ws.WebSocketServer({port:8080},()=>{
    console.log("server creado");
})

//datos del juego----------------------------------------------------------

var jugadores = new Map();//guardo indice =conexion, dato=datos del jugador
var siguienteid=0;

//fruta
var fruta={
    x: Math.floor(Math.random()*480),
    y: Math.floor(Math.random()*480),
};

function enviarATodos(obj){
    jugadores.forEach((d,c)=>{
        c.send(JSON.stringify(obj));
    });
}

server.addListener("connection", (conexionesJugadores)=>{
    console.log("alguien se ha conectado");

    //crear nuevo jugador-----------------------------
    
    let datos={
        id: siguienteid, 
        posx: Math.floor(Math.random()*480), 
        posy: Math.floor(Math.random()*480),
        dir: "0",
        puntos: 0,
    };

    siguienteid++;//para que la siguiente conexion tenga otro id
    jugadores.set(conexionesJugadores, datos);

    //avisar a todos de que alguien a entrado--------------
    jugadores.forEach((d, c)=>{
        c.send(
            JSON.stringify(
                {
                    tipo:"new",
                    datos: datos,
                }
            )
        );
    })

   //avisar al nuevo, de todos lo jugadores que ya existian antes

   jugadores.forEach((d,c)=>{
    if(c!=conexionesJugadores){// SOLO AL RESTO DE JUGADORES
    conexionesJugadores.send(
        JSON.stringify({
            tipo: "new",
            datos: d,
        })
    );
  } 
})  
  conexionesJugadores.send(
    JSON.stringify({
        tipo:"fruta",
        datos: fruta,
    })
  );



//avisar de quien habia antes
    conexionesJugadores.addEventListener("close", ()=>{
        console.log("alguien se ha desconctado");

        //quien se ha desconectado------------------------------
        var datosDesconectPlayer = jugadores.get(conexionesJugadores);

        //eliminarlo de la lista---------------------------------
        jugadores.delete(conexionesJugadores);
     
        //avisar a los demas--------------------------------------
        jugadores.forEach((d,c)=>{
            c.send(
                JSON.stringify({
                    tipo:"delete",
                    datos:datosDesconectPlayer.id,
                })
            );
        });
    });
    
    conexionesJugadores.addEventListener("message", (m)=>{
        mensaje=JSON.parse(m.data.toString());

        if(mensaje.tipo=="mover"){
            var datosDeljugador=jugadores.get(conexionesJugadores);
            //datosDeljugador=mensaje.datos;

            //guardar info actualizado
            //jugadores.set(conexionesJugadores,datosDeljugador);
            datosDeljugador.posx = mensaje.datos.posx;
            datosDeljugador.posy = mensaje.datos.posy;
            datosDeljugador.dir  = mensaje.datos.dir;


            //informar a todos
            jugadores.forEach((d,c)=>{
            c.send(JSON.stringify({tipo:"mover",datos:datosDeljugador}))
            });
        }

        //cuando alguien coje la fruta:
        if(mensaje.tipo=="coger"){
            let jugador=jugadores.get(conexionesJugadores);
            jugador.puntos++;

            fruta={
                x: Math.floor(Math.random()*480),
                y: Math.floor(Math.random()*480),
            };

            //avisar al jugador dnd esta la nueva fruta
            enviarATodos({
                tipo:"puntos",
                datos:[...jugadores.values()],
            });

            enviarATodos({
                tipo: "fruta",
                datos: fruta,
            });

        }
    });
});