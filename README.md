# BatteryAR — Química em Loop

Experiência educacional 3D e WebAR para explorar, em escala conceitual, o funcionamento de baterias recarregáveis de íons de lítio e de íons de sódio.

## Experiência

- bateria 3D construída proceduralmente, sem arquivo de modelo externo;
- ânodo, cátodo, eletrólito, separador e coletores selecionáveis;
- animação do sentido líquido dos íons e elétrons;
- alternância entre carga e descarga;
- comparação entre células de íons de lítio e íons de sódio;
- vista explodida controlável;
- posicionamento da bateria sobre uma superfície em aparelhos compatíveis com WebXR;
- rotação por arraste e escala por gesto de pinça sem perder a âncora no ambiente;
- reposicionamento e restauração da vista por controles dedicados;
- legenda científica para íons, elétrons e polaridade dos eletrodos;
- seleção de componentes diretamente no modelo 3D e no modo AR, com etiqueta, material e explicação contextual;
- explicações diferentes para carga e descarga;
- modo 3D com rotação e zoom como fallback universal;
- identidade visual integrada ao portal Química em Loop.

## Como executar

O projeto usa módulos JavaScript e deve ser servido por HTTP(S). Na pasta do projeto:

```bash
python3 -m http.server 8000
```

Abra `http://localhost:8000`. A realidade aumentada requer HTTPS quando publicada, além de navegador e aparelho compatíveis.

## GitHub Pages

1. Abra **Settings → Pages** no repositório.
2. Em **Build and deployment**, selecione **Deploy from a branch**.
3. Selecione a branch `main` e a pasta `/root`.
4. Salve e aguarde a publicação.

## Compatibilidade

O modo 3D funciona em navegadores modernos com WebGL. O modo AR utiliza WebXR `immersive-ar` com detecção de superfícies (`hit-test`). A disponibilidade depende do navegador, do sistema operacional e do suporte do aparelho. Em dispositivos sem WebXR, a experiência permanece completamente navegável em 3D.

No modo AR, toque no círculo para posicionar a célula. Depois, arraste com um dedo para girar, faça o gesto de pinça para ajustar a escala e toque numa camada para abrir a explicação. O botão **Reposicionar** procura um novo ponto sem reiniciar a sessão.

## Observações científicas

A representação é conceitual e não está em escala molecular. Durante a descarga, o modelo mostra oxidação no ânodo, redução no cátodo, transporte iônico pelo eletrólito/separador e transporte eletrônico pelo circuito externo. Na carga, uma fonte externa força a inversão líquida desses processos. Para evitar ambiguidade didática, os termos ânodo e cátodo usados na interface referem-se à operação de descarga; os sinais `−` e `+` identificam, respectivamente, os eletrodos negativo e positivo da célula.

As faixas de densidade de energia são indicativas em nível de célula e variam conforme química, fabricante, projeto e condição de operação. A tecnologia de íons de sódio deve ser apresentada como complementar, não como substituta universal da tecnologia de íons de lítio.

## Referências técnicas

- [Three.js — exemplo oficial WebXR AR hit test](https://threejs.org/examples/webxr_ar_hittest.html)
- [W3C — WebXR Hit Test Module](https://www.w3.org/TR/webxr-hit-test-1/)
- [MDN — WebXR Device API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)

## Referências científicas

- Tarascon, J.-M.; Armand, M. *Issues and challenges facing rechargeable lithium batteries*. Nature, 2001.
- Goodenough, J. B.; Park, K.-S. *The Li-Ion Rechargeable Battery: A Perspective*. JACS, 2013.
- Slater, M. D. et al. *Sodium-Ion Batteries*. Advanced Functional Materials, 2013.
- Hwang, J.-Y.; Myung, S.-T.; Sun, Y.-K. *Sodium-ion batteries: present and future*. Chemical Society Reviews, 2017.

## Autoria e licença

**André A. Souto — Química em Loop**, 2026.

Da ideia ao prompt. Do prompt à simulação. Da simulação à aprendizagem.

A ideia nasce do ser humano, a IA auxilia na criação do protótipo e o ser humano audita e valida. Código distribuído sob a licença MIT.
