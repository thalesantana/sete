/** Card explicando o algoritmo do jogo em linguagem simples. */
export function HowItWorks(props: { onClose: () => void }) {
  return (
    <div className="help-overlay" onClick={props.onClose}>
      <div className="help-card card" onClick={e => e.stopPropagation()}>
        <button className="help-close" onClick={props.onClose} aria-label="Fechar">✕</button>
        <div className="eyebrow">COMO FUNCIONA</div>
        <h2 className="display help-title">O JOGO POR DENTRO</h2>

        <div className="help-body">
          <section>
            <h3>🎲 Você monta um time dos sonhos</h3>
            <p>
              Role o dado, sai uma seleção e uma Copa, e você escolhe <b>um craque</b> dela.
              Role de novo, escolha outro — montando 11 titulares de seleções e épocas diferentes.
            </p>
          </section>

          <section>
            <h3>⭐ Cada jogador tem uma nota</h3>
            <p>
              É a qualidade dele (de 0 a 99). Quem joga no ataque deixa seu <b>ataque</b> mais forte;
              quem joga atrás deixa sua <b>defesa</b> mais forte.
            </p>
          </section>

          <section>
            <h3>⚖️ Montar bem importa mais que juntar nomes</h3>
            <p>
              Ter craques ajuda, mas o seu <b>pior titular</b> puxa o time pra baixo. Então
              2 estrelas + 9 pernas-de-pau não viram um timaço — você precisa tapar os buracos.
            </p>
          </section>

          <section>
            <h3>🎯 Cada jogo é uma "loteria controlada"</h3>
            <p>
              Quanto mais forte seu ataque comparado à defesa do rival, maior a chance de fazer
              muitos gols (e vice-versa). Mas tem <b>sorte</b>: um time com craque tem
              "dia de gênio" (golea) ou "dia apagado" (tropeça). Nada é garantido.
            </p>
          </section>

          <section>
            <h3>🏆 A Copa são 7 jogos</h3>
            <p>
              3 na fase de grupos (os 2 melhores passam — dá pra empatar/perder e avançar) e
              4 de mata-mata (tem que vencer; empate vai pra <b>pênaltis</b>). Ser campeão é
              passar pelos 7. O <b>7 a 0</b> perfeito é vencer todos eles.
            </p>
          </section>

          <section>
            <h3>🔁 O destino já está escrito</h3>
            <p>
              O resultado depende de uma "semente da sorte" fixa: o <b>mesmo time no mesmo
              sorteio dá sempre o mesmo resultado</b>. A única forma de mudar a história é
              mudar quem você escala.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
