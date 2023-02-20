### funcao alerta

geraAlerta <- function( sintoma,regiao='Brasil',alisa,sigma,corte=3,debug=FALSE) {
    
    if(regiao != 'Brasil') alerta <- alerta[alerta$city==regiao,]
    
    if (nrow(alerta) < 5) return("poucas linhas")
    
    
    cond <- grepl(sintoma,alerta$sintomas)
    
    #if(regiao != 'BRASIL') cond <- cond & (alerta$region == regiao)
    
    
    if (length(cond) < 5) return("N condicoes para loess")
    
    sinal <- filter(alerta,cond) %>%  select(data) %>% group_by(data) %>% summarize(casos= n())
    
    if (nrow(sinal) < 5) return("N pequeno para loess")
    
    #if(regiao != 'BRASIL')  
    #serie <- xts(sinal$casos,order.by = as.Date(sinal$data))
    
    rg <- range(sinal$data)
    dd <- seq(rg[1],rg[2],by='1 day')
    sinal <- merge(sinal,data.frame(dd),by.x='data',by.y='dd',all.y=T)
    sinal$casos <- ifelse(is.na(sinal$casos),0.01,sinal$casos)
    
    if (debug) print (paste("Numero de Registros =",nrow(sinal)) ) 
    
    ## adicionado o predito por AR(1) como ultimo registro
    sinal <- data.frame (
        data=c(sinal$data,as.Date(max(sinal$data)+1,origin='1970-01-01')) ,
        casos=c(sinal$casos,predict(ar(sinal$casos,1),n.ahead = 1)$pred)
        
    )
    
    
    ## cria o loess com intervalo de confianca
    tres <- loess.sd(sinal,span=alisa,nsigma = sigma)
    
    # Amarelo testa se esta acima e sem foram mais de X casos
    altos <- ifelse(sinal$casos > tres$upper & sinal$casos > corte,TRUE,FALSE)
    
    
    # o segundo amarelo seguido e convertido em laranja
    
    laranja <- rep(FALSE,length(altos))
    
    for(i in 2:(length(altos)-1))  
        if((altos[i] & altos[i-1]) & sinal$casos[i] > corte) laranja[i] <- TRUE 
    
    
    # o segundo laranja seguido vira vermelho
    vermelho <- rep(FALSE,length(altos))
    for(i in 2:(length(laranja)-1))  
        if((laranja[i] & laranja[i-1]) & sinal$casos[i] > corte) vermelho[i] <- TRUE 
    
     ### estruturando o output
    sinal$regiao <- regiao
    
    sinal$sintoma <- sintoma
    sinal$ponto_corte <- tres$upper
    sinal$classifica <- altos+laranja+vermelho
    
    sinal$classifica <- ifelse(sinal$casos < corte, 0 ,sinal$classifica)
    
    sinal$fcod <- ifelse(sinal$classifica==0,"VERDE",NA)
    sinal$fcod <- ifelse(sinal$classifica==1,"AMARELO",sinal$fcod)
    sinal$fcod <- ifelse(sinal$classifica==2,"LARANJA",sinal$fcod)
    sinal$fcod <- ifelse(sinal$classifica==3,"VERMELHO",sinal$fcod)
    
    sinal$fcor <- ifelse(sinal$classifica==0,"#68ba44",NA)
    sinal$fcor <- ifelse(sinal$classifica==1,"#e8a512",sinal$fcor)
    sinal$fcor <- ifelse(sinal$classifica==2,"#f47821",sinal$fcor)
    sinal$fcor <- ifelse(sinal$classifica==3,"#d0021b",sinal$fcor)
    
    
    
   
    
    sinal$msg  <- ifelse(sinal$classifica==1,paste("Aumento de ",sintoma) , "Normal")
    sinal$msg  <- ifelse(sinal$classifica==2,paste("Aumento sustentado de ",sintoma) , sinal$msg)
    sinal$msg  <- ifelse(sinal$classifica==3,paste("Pico de ",sintoma) , sinal$msg)
                                                    
    
    #retorna a os dados
    
    sinal$alisa <- alisa
    sinal$sigma <- sigma
    sinal$corte <- corte
    
    sinal$data <- as.character(sinal$data)
    
    tam <- nrow(sinal)
    sinal[(tam-7):tam,]

}





#########
geraAlertaRegioes <- function (lista_sintomas,reg='Brasil',alisa=0.80,sigma=1,corte=3) {

    result <- list()

    
    for (i in 1:length(lista_sintomas)) {
       result[[i]] <- geraAlerta(lista_sintomas[i],alisa=alisa,sigma=sigma,corte=corte,regiao = reg)
       names(result)[i] <- lista_sintomas[i]
    }
result   

tmp <- do.call(rbind,result[which(names(result) %in% names(unlist(sapply(result,nrow))))])
row.names(tmp) <- NULL

tmp

}



