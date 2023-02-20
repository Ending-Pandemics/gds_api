## script espacial nova versão

setwd("/home/gds/api/usr/R/script_kernel/")      		## alterar para PATH do server onde ficara o script
dir <- 'camadas/'              		## folder abaixo onde ficam os shapes
onde <- 'output/'      	## folder para output das imagens e html

## lendo o arquivo CSV direto da epitrack
exporta <- read.csv2("https://s3.amazonaws.com/gdsreports/surveys_reports.csv",as.is=TRUE)

exporta$DT_CADASTRO <- as.Date(exporta$DT_CADASTRO)
exporta$DT_REGISTRO_DIA <- as.Date(exporta$DT_REGISTRO_DIA)


filtro <- exporta$DT_REGISTRO_DIA >= as.Date('2016-07-12')


## remove inicio com fase de testes
guardioes <- exporta[filtro,]

## cria sindromes
sindrome <- rep('NAO',nrow(guardioes))
sindrome <- ifelse(guardioes$DIARREIA=='SIM','DIARREICA',sindrome)
sindrome <- ifelse(guardioes$SIND_RES=='SIM','RESPIRATORIA',sindrome)
guardioes$SINDROME <- ifelse(guardioes$SIND_EXA=='SIM','EXANTEMATICA',sindrome)

## filtro da ultimos N dias
DIAS <- 15  ## buscas casos no passado por quantos dias
filtro2 <- guardioes$DT_REGISTRO_DIA >= Sys.Date() - DIAS


## filtro de sem sindromes


filtro3 <- guardioes$SINDROME!='NAO'



### tabela ultima semana
table(guardioes$DT_REGISTRO_DIA[filtro2 & filtro3],guardioes$SINDROME[filtro2 & filtro3])


### para trabalhar
tmp <- guardioes[filtro2 & filtro3,]

lsym <- split(tmp,tmp$SINDROME)


### os que estão bem na mesma janela de tempo
bem <- guardioes[filtro2 & !filtro3,]
bem$LONG <- as.numeric(bem$LONG)
bem$LAT   <- as.numeric(bem$LAT)


#### parte espacial
library(sp)
library(maptools)
library(splancs)
library(rgdal)

### criando a paleta de cores
library(colorspace)
cores <- rev(heat_hcl(30, c = c(80, 30), l = c(30, 90), power = c(1/5, 1.3)))
cores[1] <- "#E2E6BD80"


### carregando funcoes auxiliares

source("funcao_mapa_web_v3.r")

### preparando os dados para o kernel

locais <- c("Rio de Janeiro","São Paulo","Brasília","Salvador","Belo Horizonte","Manaus","Brasil")
shapes <- c("rio","sampa","df","salvador","bh","manaus","br")
sindromes <-names(lsym)

## definicoes

GridSize <- 2000 # tamanho do Grid, maior mais resolucao e BEM maior tempo processamento!!!
MinCases <- 1   # numero minimo de casos

proj <- "+init=epsg:4326 +proj=longlat +datum=WGS84 +no_defs +ellps=WGS84 +towgs84=0,0,0"

##

TAM <- length(shapes)
#TAM <- 1
for (loc in 1:TAM) {
  bw <- ifelse(loc == 7, 0.68, 0.008) #aproiximadamente 2 Km e 75 km p/ Brasil


  #poli  <-paste0('camadas/',shapes[loc],'.shp')
  #cont  <-paste0('camadas/',shapes[loc],'_cont.shp')



  #
  # poligono <- readShapeSpatial(poli,CRS("+proj=longlat +datum=WGS84"))
  # contorno <- readShapeSpatial(cont,CRS("+proj=longlat +datum=WGS84"))

  poligono <- readOGR(dir, layer = shapes[loc])
  #proj4string(poligono) <- CRS(proj)
  poligono <- spTransform(poligono, CRS(proj))

  contorno <- readOGR(dir, layer = paste0(shapes[loc], "_cont"))
  #proj4string(contorno) <- CRS(proj)
  contorno <- spTransform(contorno, CRS(proj))

  ## loop sindromes
  for (sin in 1:length(lsym)) {
    arq <- lsym[[sin]]
    arq$LONG <- as.numeric(arq$LONG)
    arq$LAT   <- as.numeric(arq$LAT)

    casos <- arq[, c("LONG" , "LAT")]

    spdf <-
      SpatialPointsDataFrame(coords = casos,
                             data = arq,
                             proj4string = CRS(proj))



    lixo <-
      over(spdf , contorno, fn = NULL)  ## descobre se os poligonos estao fora do contorno
    spdf <- spdf[!is.na(lixo[, 1]), ]  ## limpa o spatial data.frame

    pontos <- as.data.frame(coordinates(spdf))

    if (nrow(spdf) < MinCases) {
      arq <- paste0(onde, toupper(shapes[loc]), '_', sindromes[sin], '.png')
      png(
        file = arq,
        bg = "transparent",
        width = 600,
        height = 400
      )
      par(mar = c(0, 0, 0, 0),
          xaxs = "i",
          yaxs = "i")
      titulo <-
        paste0(locais[loc], " - Casos INSUFICIENTES de Sindrome ", sindromes[sin])
      plot(contorno,
           border = 'black',
           col = cores[1],
           main = titulo)
      dev.off()
      gerawebmap(shapes[loc], sindromes[sin], contorno, NULL)
      next()
    }
    ### criar grid sobre a area
    sG <- Sobj_SpatialGrid(contorno, maxDim = GridSize)$SG
    gt <- slot(sG, "grid")

    ## retira o poligono principal, caso de ilhas tera de ser tratado a parte!!!

    pcont <-
      slot(slot(slot(contorno, "polygons")[[1]], "Polygons")[[1]], "coords")



    kcaso.1 <- spkernel2d(SpatialPoints(casos), pcont, h0 = bw, gt)

    kernels <-
      SpatialGridDataFrame(gt, data = data.frame(kkm = kcaso.1))

    spkratio <- as(kernels, "SpatialPixelsDataFrame")

    if (shapes[loc] == 'rio') {
      pilha <-
        slot(slot(slot(contorno, "polygons")[[4]], "Polygons")[[1]], "coords")
      kcaso.2 <- spkernel2d(SpatialPoints(casos), pilha, h0 = bw, gt)
      kernels2 <-
        SpatialGridDataFrame(gt, data = data.frame(kkm = kcaso.2))
      spkratio2 <- as(kernels2, "SpatialPixelsDataFrame")
    }


    ## atribuir projecao
    proj4string(spkratio) <- CRS(proj)

    titulo <-
      paste0(locais[loc], " - Casos de Sindrome ", sindromes[sin])

    llGRD <- GE_SpatialGrid(spkratio)

    arq <-
      paste0(onde, toupper(shapes[loc]), '_', sindromes[sin], '.png')
    png(
      file = arq,
      bg = "transparent",
      width = llGRD$width,
      height = llGRD$height
    )
    par(mar = c(0, 0, 0, 0),
        xaxs = "i",
        yaxs = "i")
    #par(mar=c(0,0,2,0), xaxs = "i", yaxs = "i")

    plot(contorno,
         border = 'white',
         col = cores[1],
         main = '')
    image(spkratio, col = cores, add = T)
    polygon(pcont, border = 'grey', lwd = 0.2)
    polygon(pcont, border = 'black', lwd = 0.2)

    if (shapes[loc] == 'rio') {
      if (max(spkratio2$kkm) == 0) {
        image(spkratio2, col = cores[1], add = T)
        polygon(pilha, border = 'black', lwd = 0.2)
        plot(contorno,
             border = 'black',
             lwd = 0.7,
             add = T)
        dev.off()
        gerawebmap(shapes[loc], sindromes[sin], contorno, spkratio, NULL, pontos)
        next()
      }

      proj4string(spkratio2) <- CRS(proj)
      image(spkratio2, col = cores, add = T)
      polygon(pilha, border = 'grey', lwd = 0.2)
      polygon(pilha, border = 'black', lwd = 0.2)
      plot(contorno,
           border = 'black',
           lwd = 0.7,
           add = T)
      dev.off()
      gerawebmap(shapes[loc],
                 sindromes[sin],
                 contorno,
                 spkratio,
                 spkratio2,
                 pontos)

    } else {
      plot(contorno,
           border = 'black',
           lwd = 0.7,
           add = T)
      dev.off()
      gerawebmap(shapes[loc], sindromes[sin], contorno, spkratio, NULL, pontos)
      if (shapes[loc]=='br') gerawebmap(shapes[loc], sindromes[sin], contorno, spkratio, NULL, pontos,cluster=TRUE)
    }
  }
}
