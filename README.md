# Treinamento Visual de Soldagem

Plataforma online de treinamento para interpretar simbologia de soldagem, reconhecer juntas e identificar posições em chapas. O aprendizado acontece por desenhos técnicos, comparação visual, ordens de serviço simuladas e correção imediata.

A aplicação é estática e reúne os cinco jogos em um único arquivo HTML. Também funciona offline, sem instalação, com progresso salvo no navegador.

O código está no [repositório do projeto](https://github.com/mathyas2026floragold-arch/SIMBOLOGIA-DE-SOLDAGEM-).

## Os cinco modos

| Modo | Atividade |
| --- | --- |
| **MATCH VISUAL** | Relacionar símbolos e soldas executadas, alternando os dois sentidos da comparação. |
| **DETETIVE DO DESENHO** | Investigar os requisitos de uma indicação e reconhecer os elementos do símbolo e as partes do filete. |
| **MONTE O SÍMBOLO** | Interpretar uma descrição técnica e construir a peça e sua indicação de soldagem pelas escolhas de junta, símbolo, medidas e complementos. |
| **FISCAL DE FABRICAÇÃO** | Comparar projeto e execução e identificar a divergência exata quando houver. |
| **DESAFIO 3D DE POSIÇÕES** | Reconhecer posições, orientação, acesso e geometria da união em relação à gravidade. |

## Recursos

- **19 famílias de solda**, incluindo filete, chanfros, tampão, ponto, costura, reverso, revestimento e símbolos flangeados de desenhos legados.
- Juntas de topo, T/ângulo, canto, aresta/borda e sobreposta, além das geometrias específicas das famílias adicionais.
- **21 focos de anatomia**: 15 elementos ou posições da indicação e seis partes do filete. Os nomes das respostas aparecem na correção.
- **Oito processos**: GTAW/TIG, GMAW/MIG-MAG, SMAW/eletrodo revestido, FCAW/arame tubular, SAW/arco submerso, PAW/plasma, RSW/ponto por resistência e RSEW/costura por resistência.
- Cauda bifurcada com processo e referência apresentados separadamente, conforme o exercício.
- Posições **1F–4F e 1G–4G**, significados e correspondências ISO/EN; nas verticais, distinção entre avanço ascendente e descendente.
- Ordens de serviço de manutenção com equipamento/TAG, componente, desenho, revisão e requisitos técnicos.
- XP, sequência de acertos, desempenho e **12 níveis**, com prévia do nível máximo que preserva o progresso pessoal.
- Interface responsiva para computador e celular, desenhos originais e reforço do assunto após erros.

## Progressão

Os modos **1, 2, 4 e 5** avançam conforme os acertos em cada jogo. O XP geral não pula as etapas de um modo ainda não praticado.

| Acertos no modo | Etapa |
| --- | --- |
| 0–3 | Primeiras juntas: T e topo, filete e reto, lado da seta, solda contínua e posições 1F/1G. |
| 4–7 | Mais juntas e lados: canto, sobreposta, V, bisel, lado oposto e ambos quando aplicáveis, posições 2F/2G. |
| 8–15 | Medidas e distribuição: comprimento, passo, contorno, campo e cotas aplicáveis. |
| 16–27 | Novas famílias: X, K, U, J, tampão, ponto, costura, acabamento e posições verticais. |
| 28–43 | Leitura avançada: duplos U/J, chanfros flangeados, reverso, revestimento, apoio e posições sobrecabeça. |
| 44 ou mais | Leitura completa: todas as 19 famílias, incluindo símbolos flangeados de desenhos legados. |

No Detetive, as investigações de anatomia entram a cada quarta investigação elegível, a partir de oito acertos no modo. Os focos básicos aparecem primeiro; os demais são liberados com a progressão.

O **jogo 3 começa complexo**, com todas as famílias disponíveis. Seu primeiro caso tem **18 escolhas**: junta de topo em V, S = 8 mm, E = 10 mm, espessura de 10 mm, raiz de 3 mm, face da raiz de 2 mm, ângulo de 60°, lado da seta, distribuição contínua, contorno plano, acabamento G, campo, apoio removível, processo GTAW e referência DET. A. A referência correta só aparece após a conferência.

## Executar

Abra **`index.html`** ou **`SIMBOLOGIA DE SOLDAGEM.html`** no navegador. Os dois arquivos contêm o mesmo jogo completo; a pasta `work` é usada no desenvolvimento.

Para uma prévia por servidor local, com Node.js instalado, execute na raiz do projeto:

```sh
node work/preview-server.cjs
```

A prévia fica disponível em `http://127.0.0.1:8743/`. O arquivo HTML também pode ser servido por uma hospedagem estática.

O progresso pertence ao navegador e à origem em que o jogo foi aberto. Abrir por arquivo local e abrir por um endereço de servidor podem usar históricos de progresso diferentes.

## Construir

Os módulos de desenvolvimento estão em `work`. Para reconstruir o HTML a partir das fontes e da base incluída nessa pasta:

```sh
node work/build-five-modes.cjs
```

O comando atualiza `SIMBOLOGIA DE SOLDAGEM.html` e `index.html` na raiz. A execução do jogo não exige Node.js nem dependências externas.

## GitHub Pages

O repositório está preparado para hospedagem estática. Nas configurações do repositório, em **Pages**, selecione **Deploy from a branch**, a branch **main** e a pasta **/ (root)**. O arquivo `index.html` é a página de entrada. A disponibilidade do endereço público depende da ativação e conclusão da publicação pelo GitHub.

Consulte a [documentação oficial do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) para os detalhes da publicação.

## Verificar

Execute as sete verificações na raiz do projeto:

```sh
node work/check-levels-v3.cjs
node work/check-special-weld-gameplay.cjs
node work/check-five-modes.cjs
node work/check-builder-workspace.cjs
node work/check-progression.cjs
node work/check-technical-builder.cjs
node work/check-process-anatomy.cjs
```

Elas cobrem níveis, progresso salvo, prévia do máximo, integração dos cinco modos, respostas únicas, reforço, montagem e correção por campo, progressão, parâmetros técnicos, processos e anatomia.

## Convenções de estudo

O material adota a convenção AWS de linha de referência única: abaixo corresponde ao lado da seta; acima, ao lado oposto. As dimensões são em milímetros e os desenhos são esquemáticos, sem escala. Símbolos flangeados de desenhos legados são identificados no treinamento.

Referências técnicas incluem o [guia de símbolos da Miller](https://www.millerwelds.com/en-us/resources/knowledge-hub/welding-basics/how-to-read-and-understand-weld-symbols) e os materiais [Design — Part 1](https://www.twi-global.com/technical-knowledge/job-knowledge/design-part-1-090) e [Design — Part 2](https://www.twi-global.com/technical-knowledge/job-knowledge/design-part-2-091), da TWI. Para fabricação, prevalecem a norma e o desenho aplicáveis.
