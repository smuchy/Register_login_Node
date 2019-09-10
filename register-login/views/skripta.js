crtajTabelu();

function crtajTabelu() {
  let tabela = document.querySelector("table");
  tabelaHTML =
    "<thead><th>bilo</th><th>sta</th><th>bre</th></thead><tbody></tbody>";
  tabela.innerHTML = tabelaHTML;
}
