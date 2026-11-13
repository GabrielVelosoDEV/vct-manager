#!/usr/bin/env python3
"""
AS HABILIDADES NO MAPA — o que cada uma desenha (e os prompts)

Uso: python3 -I tools/habilidades.py   → grava assets/gameplay/habilidades/PROMPTS.md

A lista PECAS abaixo é a fonte única: o preparo das imagens
(tools/gameplay-imagens.py) lê daqui os nomes de arquivo de cada agente, e
este script monta um prompt completo para cada peça.

Tipos de peça (o jogo usa cada um de um jeito):
  projetil  o que voa (flecha, granada, orbe)        512×512, objeto no meio
  objeto    o que fica no chão (câmera, torreta)     512×512
  area      efeito redondo no chão (fumaça, fogo)    1024×1024, centro = centro
  parede    faixa que se repete (parede de fogo)     1024×256, emenda sem costura
  clarao    explosão ou clarão saindo do centro      1024×1024
  rastro    risco reto (corrida, feixe, rachadura)   1024×256, começa na esquerda
  cone      onda em leque, sai da esquerda           1024×1024
Os ícones C/Q/E/X do HUD continuam nas pastas dos agentes.
"""
import os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# cor de fundo: verde-chave, ou magenta quando o efeito é verde
VERDE, MAGENTA = '#00FF00', '#FF00FF'

# agente: (paleta, fundo, [(arquivo, tipo, o que é)])
PECAS = {
    # ---------------- duelistas ----------------
    'jett': ('branco, azul-claro e ciano bem pálido, como vento', VERDE, [
        ('c_area', 'area', 'uma nuvem de fumaça branca e azulada em espiral, pequena e densa, que tapa a visão (Cloudburst)'),
        ('q_clarao', 'clarao', 'uma lufada de vento subindo do chão, anéis de ar em espiral e folhas e poeira voando para fora (Updraft)'),
        ('e_rastro', 'rastro', 'o rastro de uma arrancada muito rápida: riscos de vento branco-azulado e poeira levantada (Tailwind)'),
        ('x_projetil', 'projetil', 'uma faca de arremesso tipo kunai, com lâmina de energia azul-clara brilhante e rastro de vento (Blade Storm)'),
    ]),
    'phoenix': ('laranja, dourado e vermelho de fogo, com branco quente no centro', VERDE, [
        ('c_parede', 'parede', 'uma parede de chamas altas e vivas, laranja e douradas, com brasas e fumaça fina saindo das pontas das labaredas (Blaze)'),
        ('q_projetil', 'projetil', 'um orbe pequeno de fogo branco-dourado que faz uma curva no ar (Curveball)'),
        ('q_clarao', 'clarao', 'o estouro de um clarão de luz branca e dourada, muito forte no centro, que cega quem olha (Curveball)'),
        ('e_projetil', 'projetil', 'uma bola de fogo incandescente com rastro de faíscas (Hot Hands)'),
        ('e_area', 'area', 'uma poça redonda de chamas no chão, fogo baixo e vivo com brasas, mais forte no centro (Hot Hands)'),
        ('x_objeto', 'objeto', 'um marcador de renascimento no chão: um círculo de chamas douradas com um símbolo de ave de fogo no meio, brilhando (Run It Back)'),
    ]),
    'reyna': ('violeta, roxo e magenta, com brilho de energia de alma', VERDE, [
        ('c_objeto', 'objeto', 'um olho sobrenatural flutuante de energia violeta, com íris brilhante e fios de energia em volta (Leer)'),
        ('q_objeto', 'objeto', 'um orbe de alma que fica no chão depois de um abate: uma esfera roxa-translúcida pulsando com fiapos de energia subindo (Devour / Dismiss)'),
        ('x_area', 'area', 'uma aura de energia violeta em volta de quem está no centro, chamas roxas baixas e partículas subindo (Empress)'),
    ]),
    'raze': ('laranja, amarelo e azul-turquesa de tinta, com fumaça cinza', VERDE, [
        ('c_objeto', 'objeto', 'um pequeno robô explosivo de rodas visto de cima, carcaça laranja e amarela com faixas pretas, sensor azul na frente, olhando para a direita (Boom Bot)'),
        ('q_projetil', 'projetil', 'uma carga explosiva adesiva redonda e achatada, laranja com luz piscando (Blast Pack)'),
        ('q_clarao', 'clarao', 'uma explosão compacta com respingos de tinta azul-turquesa e laranja e fumaça (Blast Pack)'),
        ('e_projetil', 'projetil', 'uma granada de fragmentação gorda, laranja e amarela, com pino e listras (Paint Shells)'),
        ('e_clarao', 'clarao', 'uma explosão que se divide em várias pequenas bombinhas espalhadas, com respingos de tinta colorida (Paint Shells)'),
        ('x_projetil', 'projetil', 'um foguete grosso com ponta laranja e listras amarelas, chama azul saindo de trás (Showstopper)'),
        ('x_clarao', 'clarao', 'uma explosão grande e redonda de fogo laranja com anel de choque e respingos de tinta azul (Showstopper)'),
    ]),
    'yoru': ('azul-escuro profundo e ciano, com distorções dimensionais', VERDE, [
        ('c_rastro', 'rastro', 'uma trilha de pegadas de energia azul dimensional andando da esquerda para a direita, cada pegada brilhando e se apagando (Fakeout)'),
        ('q_projetil', 'projetil', 'um fragmento dimensional pontudo, cristal azul-escuro rachado com luz ciano por dentro (Blindside)'),
        ('q_clarao', 'clarao', 'um clarão que estoura em estilhaços de luz azul e ciano, como vidro dimensional quebrando (Blindside)'),
        ('e_objeto', 'objeto', 'uma âncora dimensional no chão: um portal oval pequeno e achatado, azul-escuro com borda ciano rodopiando (Gatecrash)'),
        ('x_area', 'area', 'uma distorção dimensional em volta de quem está no centro: o ar ondulando em azul translúcido, fendas finas ciano (Dimensional Drift)'),
    ]),
    'neon': ('azul elétrico e amarelo, com raios brancos', VERDE, [
        ('c_parede', 'parede', 'uma parede de eletricidade azul: um feixe de raios estalando, faíscas amarelas e linhas brancas crepitando (Fast Lane)'),
        ('q_projetil', 'projetil', 'uma bola de energia elétrica azul crepitante, com raios saindo (Relay Bolt)'),
        ('q_area', 'area', 'uma onda de choque elétrica no chão: anel de raios azuis e amarelos se espalhando do centro (Relay Bolt)'),
        ('e_rastro', 'rastro', 'o rastro de uma corrida muito rápida: faixas de eletricidade azul e amarela no chão (High Gear)'),
        ('x_rastro', 'rastro', 'um feixe de eletricidade concentrado e reto, branco no meio e azul por fora, com raios em volta (Overdrive)'),
    ]),
    'iso': ('violeta e roxo com hexágonos de energia azul-clara', VERDE, [
        ('c_parede', 'parede', 'uma parede de energia feita de hexágonos violetas encaixados, translúcida, com brilho nas emendas (Contingency)'),
        ('q_projetil', 'projetil', 'um projétil molecular: uma esfera pequena violeta com anéis hexagonais girando em volta (Undercut)'),
        ('e_area', 'area', 'um escudo de energia hexagonal violeta em volta de quem está no centro, uma bolha translúcida de hexágonos (Double Tap)'),
        ('x_area', 'area', 'o chão de uma arena quadrada de energia: um quadrado de linhas violetas brilhantes com hexágonos nos cantos (Kill Contract)'),
    ]),
    'waylay': ('branco prismático, magenta e violeta, com reflexos de arco-íris', VERDE, [
        ('c_projetil', 'projetil', 'um prisma pequeno de luz branca e magenta girando (Saturate)'),
        ('c_area', 'area', 'um aglomerado de cristais de luz prismática estourando no chão, magenta, violeta e branco (Saturate)'),
        ('q_rastro', 'rastro', 'o rastro de uma arrancada na velocidade da luz: faixas prismáticas magenta e brancas (Lightspeed)'),
        ('e_objeto', 'objeto', 'um ponto de retorno no chão: um losango de luz prismática flutuando com reflexos de arco-íris (Refract)'),
        ('x_cone', 'cone', 'um feixe prismático largo que se abre em leque, luz magenta, violeta e branca em camadas (Convergent Paths)'),
    ]),
    # ---------------- iniciadores ----------------
    'sova': ('azul elétrico e ciano, com metal cinza-azulado', VERDE, [
        ('c_objeto', 'objeto', 'um drone de reconhecimento pequeno de quatro hélices, visto de cima, corpo azul-escuro e luz ciano, olhando para a direita (Owl Drone)'),
        ('q_projetil', 'projetil', 'uma flecha tecnológica com ponta elétrica azul faiscando (Shock Bolt)'),
        ('q_area', 'area', 'uma descarga elétrica no chão: raios azuis saindo do centro em todas as direções (Shock Bolt)'),
        ('e_projetil', 'projetil', 'uma flecha tecnológica com ponta de sensor ciano piscando (Recon Bolt)'),
        ('e_area', 'area', 'um pulso de radar: anéis finos ciano se espalhando do centro como ondas, só linhas e pontos (Recon Bolt)'),
        ('x_rastro', 'rastro', 'um feixe de energia azul reto e grosso, branco no meio, que atravessa paredes (Hunter\'s Fury)'),
    ]),
    'breach': ('laranja, marrom e amarelo, com poeira e pedra rachada', VERDE, [
        ('c_area', 'area', 'uma carga sísmica explodindo no chão em três pulsos: anéis de choque laranja e pedaços de pedra (Aftershock)'),
        ('q_clarao', 'clarao', 'um clarão laranja e branco estourando com faíscas (Flashpoint)'),
        ('e_rastro', 'rastro', 'uma rachadura sísmica no chão, pedra partida com luz laranja saindo das fendas e poeira (Fault Line)'),
        ('x_cone', 'cone', 'ondas de choque sísmicas em leque: o chão se levantando em ondas de pedra e poeira laranja (Rolling Thunder)'),
    ]),
    'skye': ('verde-folha, dourado e marrom de couro, com luz de natureza', MAGENTA, [
        ('c_area', 'area', 'um brilho de cura no chão: luz verde-dourada suave com folhas e sementes de luz subindo (Regrowth)'),
        ('q_objeto', 'objeto', 'um animal espiritual original feito de energia verde-dourada, parecido com um lobo magro listrado, correndo para a direita, visto de cima (Trailblazer)'),
        ('e_projetil', 'projetil', 'um falcão de luz verde-dourada com asas abertas, visto de cima, voando para a direita (Guiding Light)'),
        ('e_clarao', 'clarao', 'um clarão de luz verde e dourada estourando com penas de luz (Guiding Light)'),
        ('x_projetil', 'projetil', 'uma pequena criatura buscadora feita de luz verde, como um espírito alado com cauda de luz (Seekers)'),
    ]),
    'kayo': ('branco, azul-claro e cinza metálico, tecnologia militar', VERDE, [
        ('c_projetil', 'projetil', 'uma granada de fragmentação tecnológica cinza com luzes azuis (FRAG/ment)'),
        ('c_area', 'area', 'pulsos explosivos no chão: anéis de energia azul e branca com estilhaços metálicos (FRAG/ment)'),
        ('q_projetil', 'projetil', 'uma granada de clarão tecnológica, cilindro branco com faixa azul (FLASH/drive)'),
        ('q_clarao', 'clarao', 'um clarão de luz branca e azul muito forte, com linhas de interferência digital (FLASH/drive)'),
        ('e_projetil', 'projetil', 'uma faca tecnológica de arremesso com lâmina de energia azul (ZERO/point)'),
        ('e_area', 'area', 'um anel de supressão: um círculo grande de linhas azuis e símbolos de interferência se espalhando (ZERO/point)'),
        ('x_area', 'area', 'uma onda de supressão enorme: anéis concêntricos de energia azul e estática digital (NULL/cmd)'),
    ]),
    'fade': ('preto de tinta, azul-escuro e verde-azulado, como pesadelo', VERDE, [
        ('c_objeto', 'objeto', 'uma pequena criatura original feita de tinta preta e sombra, de quatro patas, rastejando para a direita, olhos azulados brilhando (Prowler)'),
        ('q_projetil', 'projetil', 'um orbe escuro de pesadelo, tinta preta rodopiando com brilho azul-esverdeado (Seize)'),
        ('q_area', 'area', 'um nó de pesadelo no chão: tentáculos de tinta preta se fechando para o centro, com brilho azulado (Seize)'),
        ('e_objeto', 'objeto', 'um olho sobrenatural flutuante de tinta preta com íris azul-esverdeada brilhante (Haunt)'),
        ('x_cone', 'cone', 'uma onda escura de pesadelo em leque: tinta preta e fumaça azulada avançando pelo chão (Nightfall)'),
    ]),
    'gekko': ('verde-limão, amarelo e roxo, criaturas fofas e coloridas', MAGENTA, [
        ('c_area', 'area', 'uma poça de gosma verde-limão explosiva se espalhando no chão, com bolhas (Mosh Pit)'),
        ('q_objeto', 'objeto', 'uma criatura original pequena e fofa, verde e amarela, de pernas curtas e olhos grandes, vista de cima, andando para a direita (Wingman)'),
        ('e_objeto', 'objeto', 'uma criatura original redonda e fofa, roxa e verde, flutuando, vista de cima (Dizzy)'),
        ('e_clarao', 'clarao', 'um jato de gosma luminosa verde-limão estourando em respingos, que cega (Dizzy)'),
        ('x_objeto', 'objeto', 'uma criatura original grande e feroz, verde com espinhos roxos, vista de cima, avançando para a direita com a boca aberta (Thrash)'),
        ('x_area', 'area', 'uma explosão de gosma que prende: respingos verdes e roxos grudentos se espalhando do centro (Thrash)'),
    ]),
    'tejo': ('bege, marrom e verde-oliva militar, com luz laranja de mira', VERDE, [
        ('c_objeto', 'objeto', 'um drone aéreo compacto e furtivo de quatro hélices, visto de cima, corpo bege e cinza com luz laranja (Stealth Drone)'),
        ('q_projetil', 'projetil', 'uma granada adesiva de concussão, cilindro verde-oliva com luz laranja (Special Delivery)'),
        ('q_clarao', 'clarao', 'uma onda de concussão: anel de pressão laranja e poeira se espalhando (Special Delivery)'),
        ('e_projetil', 'projetil', 'um míssil guiado pequeno, corpo cinza e ponta laranja, com rastro de fumaça (Guided Salvo)'),
        ('e_area', 'area', 'a explosão de um míssil no chão: fogo laranja, fumaça cinza e cratera (Guided Salvo)'),
        ('x_area', 'area', 'um bombardeio de artilharia marcado no chão: uma faixa de explosões em sequência com marcas de mira laranja (Armageddon)'),
    ]),
    # ---------------- controladores ----------------
    'brimstone': ('cinza-chumbo de fumaça, laranja de tecnologia e vermelho de fogo', VERDE, [
        ('c_area', 'area', 'um campo de estímulo no chão: um círculo laranja com setas de velocidade e brilho pulsando (Stim Beacon)'),
        ('q_projetil', 'projetil', 'uma granada incendiária cilíndrica cinza com faixa laranja (Incendiary)'),
        ('q_area', 'area', 'uma poça de fogo no chão: chamas laranja e vermelhas com brasas (Incendiary)'),
        ('e_area', 'area', 'uma fumaça grande, grossa e redonda, cinza-chumbo com reflexos laranja, que tapa tudo (Sky Smoke)'),
        ('x_area', 'area', 'um ataque orbital: um círculo de laser vermelho-alaranjado caindo do céu, chão queimando e anel de energia (Orbital Strike)'),
    ]),
    'viper': ('verde tóxico, verde-ácido e preto', MAGENTA, [
        ('c_projetil', 'projetil', 'um frasco de ácido verde-tóxico girando no ar (Snake Bite)'),
        ('c_area', 'area', 'uma poça de ácido venenoso verde borbulhando no chão (Snake Bite)'),
        ('q_objeto', 'objeto', 'um emissor de gás no chão: um cilindro metálico preto com válvula e luz verde (Poison Cloud)'),
        ('q_area', 'area', 'uma nuvem de gás tóxico verde, grossa e redonda (Poison Cloud)'),
        ('e_parede', 'parede', 'uma parede de gás venenoso verde subindo do chão, densa, com redemoinhos (Toxic Screen)'),
        ('x_area', 'area', 'uma cúpula enorme de gás tóxico verde-escuro, com névoa densa e brilho ácido (Viper\'s Pit)'),
    ]),
    'omen': ('roxo-escuro, azul-arroxeado e preto de sombra', VERDE, [
        ('c_area', 'area', 'uma sombra no chão onde alguém vai aparecer: mancha escura roxa com fiapos de fumaça subindo (Shrouded Step)'),
        ('q_rastro', 'rastro', 'uma onda de sombra reta avançando, roxa e preta, com olhos tênues de luz azulada (Paranoia)'),
        ('e_area', 'area', 'uma esfera de fumaça escura grande e redonda, roxa-azulada quase preta (Dark Cover)'),
        ('x_area', 'area', 'um redemoinho de sombra no chão, roxo e preto, onde alguém se teleporta (From the Shadows)'),
    ]),
    'astra': ('roxo cósmico, dourado e azul-estrelado, com pontos de estrela', VERDE, [
        ('c_objeto', 'objeto', 'uma estrela no chão: um ponto de luz dourada e roxa com raios finos, esperando ser ativada (estrela das habilidades C, Q e E)'),
        ('c_area', 'area', 'um poço gravitacional: vórtice roxo e dourado puxando para o centro, com espirais de estrelas (Gravity Well)'),
        ('q_area', 'area', 'um pulso de estrela explodindo: anel de luz roxa e dourada com faíscas (Nova Pulse)'),
        ('e_area', 'area', 'uma nuvem de fumaça cósmica roxa e azul, cheia de pequenas estrelas, grossa e redonda (Nebula)'),
        ('x_parede', 'parede', 'uma parede cósmica: uma cortina de energia roxa e azul com estrelas e brilho dourado (Cosmic Divide)'),
    ]),
    'harbor': ('azul-turquesa de água, branco de espuma e bronze antigo', VERDE, [
        ('c_projetil', 'projetil', 'uma esfera de água turquesa girando, com espuma em espiral (Storm Surge)'),
        ('c_area', 'area', 'um redemoinho de água turquesa explosivo no chão, girando para o centro, com espuma e gotas (Storm Surge)'),
        ('c_clarao', 'clarao', 'o estouro do redemoinho: jatos de água turquesa e espuma subindo do centro (Storm Surge)'),
        ('q_parede', 'parede', 'uma parede alta de água turquesa correndo, com espuma e gotas (High Tide)'),
        ('e_area', 'area', 'uma cúpula esférica de água turquesa translúcida, com reflexos e espuma na borda (Cove)'),
        ('x_parede', 'parede', 'uma onda gigante de água turquesa avançando pelo chão, com espuma branca na crista (Reckoning)'),
    ]),
    'clove': ('rosa, roxo e azul-claro, com borboletas de luz', VERDE, [
        ('c_clarao', 'clarao', 'um pulso de energia vital rosa e roxa, com pequenas borboletas de luz saindo (Pick-Me-Up)'),
        ('q_projetil', 'projetil', 'um orbe de energia rosa e roxa que se desfaz em partículas (Meddle)'),
        ('q_area', 'area', 'uma explosão de partículas rosa e roxas no chão que enfraquece quem está dentro (Meddle)'),
        ('e_area', 'area', 'uma nuvem de fumaça rosa e roxa, grossa e redonda, com borboletas de luz (Ruse)'),
        ('x_area', 'area', 'uma aura de energia rosa e roxa em volta de quem está no centro, com borboletas girando (Not Dead Yet)'),
    ]),
    'miks': ('amarelo-mostarda, laranja e branco, com ondas sonoras', VERDE, [
        ('c_objeto', 'objeto', 'um pequeno dispositivo de som redondo no chão, visto de cima: um alto-falante metálico com anel de luz amarela (M-Pulse)'),
        ('c_area', 'area', 'ondas sonoras de concussão: anéis amarelo-mostarda e laranja se espalhando do centro, com distorção (M-Pulse, modo concussão)'),
        ('c_area_cura', 'area', 'ondas sonoras de cura: anéis suaves branco-esverdeados se espalhando do centro, com notas musicais pequenas (M-Pulse, modo cura)'),
        ('q_clarao', 'clarao', 'um estímulo de combate: ondas sonoras amarelas e notas musicais girando em volta do centro (Harmonize)'),
        ('e_area', 'area', 'uma cortina de fumaça cinza-clara com ondas sonoras amarelas vibrando dentro, grossa e redonda (Waveform)'),
        ('x_cone', 'cone', 'uma onda sônica enorme em leque, amarelo-mostarda e branca, com anéis de pressão que empurram (Bassquake)'),
    ]),
    # ---------------- sentinelas ----------------
    'sage': ('verde-jade, azul-gelo e branco', MAGENTA, [
        ('c_parede', 'parede', 'uma parede de blocos de gelo e cristal verde-jade, sólida e translúcida, com brilho nas arestas (Barrier Orb)'),
        ('q_projetil', 'projetil', 'um orbe de gelo verde-jade com névoa fria em volta (Slow Orb)'),
        ('q_area', 'area', 'um campo de lentidão: chão coberto de gelo verde-jade cristalizado com névoa fria (Slow Orb)'),
        ('e_clarao', 'clarao', 'um brilho de cura: luz verde-jade suave com partículas subindo em espiral (Healing Orb)'),
        ('x_area', 'area', 'um círculo de ressurreição: luz verde-jade e branca subindo do chão em pilar, com anel de energia (Resurrection)'),
    ]),
    'cypher': ('branco, bege e azul-claro, tecnologia de vigilância', VERDE, [
        ('c_objeto', 'objeto', 'a ponta de um fio-armadilha preso na parede: um pequeno emissor cinza com luz azul (Trapwire)'),
        ('c_parede', 'parede', 'um fio de laser azul fino e brilhante esticado, com pontinhos de luz (Trapwire)'),
        ('q_objeto', 'objeto', 'uma gaiola de fumaça desativada no chão: um pequeno cilindro metálico com anel azul (Cyber Cage)'),
        ('q_area', 'area', 'uma gaiola cilíndrica de fumaça cinza-azulada vista de cima: anel de energia azul com fumaça por dentro (Cyber Cage)'),
        ('e_objeto', 'objeto', 'uma câmera de vigilância pequena presa na parede, vista de cima, lente azul brilhando, olhando para a direita (Spycam)'),
        ('x_clarao', 'clarao', 'um pulso de revelação: anel azul digital com padrão de dados se espalhando (Neural Theft)'),
    ]),
    'killjoy': ('amarelo, preto e roxo de tecnologia', VERDE, [
        ('c_objeto', 'objeto', 'uma granada de nanorrobôs escondida no chão: um disco amarelo e preto com luz roxa (Nanoswarm)'),
        ('c_area', 'area', 'um enxame de nanorrobôs amarelos e roxos girando no chão, como um redemoinho de partículas metálicas (Nanoswarm)'),
        ('q_objeto', 'objeto', 'um pequeno robô-alarme redondo de rodas, visto de cima, amarelo e preto com antena e luz roxa, olhando para a direita (Alarmbot)'),
        ('e_objeto', 'objeto', 'uma torreta automática compacta, vista de cima, base de tripé amarela e cano preto apontando para a direita, luz roxa (Turret)'),
        ('x_objeto', 'objeto', 'um dispositivo de contenção grande no chão: um aparelho amarelo e preto com antenas e núcleo roxo brilhando (Lockdown)'),
        ('x_area', 'area', 'um anel enorme de contenção no chão: círculo de energia roxa e amarela com linhas de varredura (Lockdown)'),
    ]),
    'chamber': ('dourado, azul-marinho e branco, elegante', VERDE, [
        ('c_objeto', 'objeto', 'uma armadilha tecnológica no chão: um disco dourado e azul-marinho com luz amarela (Trademark)'),
        ('c_area', 'area', 'um campo de lentidão dourado no chão, com anéis finos e partículas douradas (Trademark)'),
        ('e_objeto', 'objeto', 'uma âncora de teleporte no chão: um disco dourado com símbolo de seta e brilho (Rendezvous)'),
        ('x_area', 'area', 'um campo de lentidão dourado que fica onde alguém caiu abatido, anéis e partículas douradas (Tour De Force)'),
    ]),
    'deadlock': ('azul-escuro, cinza e branco, nanofios brilhantes', VERDE, [
        ('c_projetil', 'projetil', 'uma granada de nanofios cinza com luzes azuis (GravNet)'),
        ('c_area', 'area', 'uma rede de nanofios brancos e azuis cobrindo o chão em padrão de teia (GravNet)'),
        ('q_objeto', 'objeto', 'um sensor de som pequeno preso na parede, visto de cima, cinza com luz azul (Sonic Sensor)'),
        ('e_objeto', 'objeto', 'uma barreira de nanofios vista de cima em forma de X: quatro painéis de malha branca e azul saindo de um núcleo (Barrier Mesh)'),
        ('x_rastro', 'rastro', 'um cabo de nanofios reto e brilhante, branco e azul, puxando (Annihilation)'),
        ('x_objeto', 'objeto', 'um casulo de nanofios brancos e azuis enrolados, visto de cima (Annihilation)'),
    ]),
    'vyse': ('vermelho, cobre e verde-escuro de metal líquido', VERDE, [
        ('c_area', 'area', 'vinhas e espinhos de metal líquido cor de cobre espalhados pelo chão, pontudos e brilhantes (Razorvine)'),
        ('q_parede', 'parede', 'uma parede de metal líquido vermelho e cobre que irrompe do chão, com espinhos na crista (Shear)'),
        ('e_objeto', 'objeto', 'uma rosa de metal cobre e vermelho presa na parede, com pétalas afiadas (Arc Rose)'),
        ('e_clarao', 'clarao', 'um clarão de luz vermelha e cobre saindo de uma rosa metálica, com pétalas de metal voando (Arc Rose)'),
        ('x_area', 'area', 'um jardim de espinhos de metal se expandindo do centro, vermelho e cobre, enorme (Steel Garden)'),
    ]),
    'veto': ('verde-mutação, preto e branco', MAGENTA, [
        ('c_objeto', 'objeto', 'um vórtice de teleporte no chão: um redemoinho achatado verde e preto (Crosscut)'),
        ('q_projetil', 'projetil', 'um fragmento orgânico viscoso verde e preto voando (Chokehold)'),
        ('q_area', 'area', 'uma armadilha orgânica no chão: gosma verde e preta com filamentos que prendem (Chokehold)'),
        ('e_objeto', 'objeto', 'um interceptador circular no chão, visto de cima: disco preto e branco com anel de energia verde (Interceptor)'),
        ('x_area', 'area', 'uma aura de mutação em volta de quem está no centro: energia verde e preta pulsando, com veias de luz (Evolution)'),
    ]),
}

ABERTURA = ('Sprite de efeito para jogo de tiro tático visto exatamente de cima (câmera a 90° apontando para baixo, '
            'sem perspectiva), em pixel art detalhada e limpa estilo jogo indie moderno, contorno escuro fino onde houver '
            'objeto sólido, cores vivas. ')
FORMA = {
    'projetil': ('{d}, visto de cima, voando da esquerda para a direita, com um rastro curto e leve atrás. Pequeno e bem '
                 'legível mesmo reduzido, ocupando o centro da imagem.', '512×512'),
    'objeto': ('{d}. Parado no chão, visto de cima, ocupando o centro da imagem com folga, bem legível mesmo reduzido.', '512×512'),
    'area': ('{d}, visto de cima: um efeito redondo que cobre o chão, mais denso no meio e com a borda se desfazendo em '
             'partículas. O centro da imagem é o centro do efeito; ele ocupa quase toda a imagem sem encostar na borda.', '1024×1024'),
    'parede': ('{d}, vista de cima como uma faixa reta e comprida da esquerda para a direita, no meio da imagem. A faixa '
               'emenda sem costura: a ponta esquerda continua exatamente na direita.', '1024×256'),
    'clarao': ('{d}, visto de cima: uma explosão de luz e partículas saindo do centro da imagem, sem objeto sólido, '
               'ocupando quase toda a imagem sem encostar na borda.', '1024×1024'),
    'rastro': ('{d}, visto de cima: um rastro reto e comprido que começa fino e apagado na esquerda e fica mais forte '
               'na direita, no meio da imagem, ocupando a largura toda.', '1024×256'),
    'cone': ('{d}, visto de cima: uma onda em forma de leque que sai de um ponto no meio da borda esquerda e se abre '
             'para a direita, mais forte perto da origem.', '1024×1024'),
}
NOMES = {'kayo': 'KAY/O'}


def prompt(tipo, desc, paleta, fundo):
    forma, tam = FORMA[tipo]
    return (ABERTURA + forma.format(d=desc[0].upper() + desc[1:]) + f' Paleta: {paleta}. '
            f'Fundo liso {fundo} ({"verde" if fundo == VERDE else "magenta"} puro, sem degradê), sem sombra no chão, '
            f'sem texto, sem letras, sem personagens. Imagem {tam}.')


def main():
    L = ['# Habilidades no mapa — prompts', '',
         'O que cada habilidade desenha no mapa, visto de cima: o que voa, o que fica no chão, a fumaça, o fogo e as paredes.',
         'Os ícones C/Q/E/X do HUD continuam como estão, nas pastas dos agentes.', '',
         '**Como gerar**', '',
         '- Salve cada imagem em `assets/gameplay/habilidades/<agente>/<nome>.png`, com o nome exato (a pasta tem `LISTA.md`).',
         '- Pode mandar em folhas com várias peças, como fez com as mecânicas. Eu separo, contanto que as peças não se encostem.',
         '- Fundo: verde #00FF00, ou **magenta #FF00FF** nos agentes de efeito verde (Skye, Gekko, Viper, Sage e Veto), para o recorte não comer a cor do efeito.',
         '- Fumaça, fogo e clarão podem ter a borda transparente/suave: o jogo deixa semitransparente.',
         '- Só entra o que aparece no mapa para os outros. Corrida, pulo e buffs no próprio corpo viram rastro ou aura; armas das ultimates (Chamber) usam a arma normal.', '']
    papeis = [('Duelistas', ['jett', 'phoenix', 'reyna', 'raze', 'yoru', 'neon', 'iso', 'waylay']),
              ('Iniciadores', ['sova', 'breach', 'skye', 'kayo', 'fade', 'gekko', 'tejo']),
              ('Controladores', ['brimstone', 'viper', 'omen', 'astra', 'harbor', 'clove', 'miks']),
              ('Sentinelas', ['sage', 'cypher', 'killjoy', 'chamber', 'deadlock', 'vyse', 'veto'])]
    total = 0
    for titulo, ags in papeis:
        L += ['---', '', f'## {titulo}', '']
        for a in ags:
            paleta, fundo, pecas = PECAS[a]
            L += [f'### {NOMES.get(a, a.capitalize())}', '', f'Cores: {paleta}. Fundo {fundo}.', '']
            for arq, tipo, desc in pecas:
                L += [f'#### {arq}', '', '```', prompt(tipo, desc, paleta, fundo), '```', '']
                total += 1
    L.insert(2, f'{total} peças para os 29 agentes.')
    L.insert(3, '')
    out = os.path.join(RAIZ, 'assets', 'gameplay', 'habilidades', 'PROMPTS.md')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, 'w').write('\n'.join(L) + '\n')
    print(out, total, 'peças')


if __name__ == '__main__':
    main()
