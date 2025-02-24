import { useState, useCallback } from "react";
import Select from "react-select";
import { format, isValid, startOfToday } from "date-fns";

// Dados estáticos
const UNIDADES = [
  "DJBA-AM", "TQTP-AM", "BNOC-BA", "PQSH-BA", "PRLA-BA", 
  "ALDT-CE", "STDU-CE", "WSOA-CE", "ASAN-DF", "BSIA-DF",
  "EPIA-DF", "GAMA-DF", "GBSL-DF", "PKSB-DF", "TGTG-DF",
  "W3NT-DF", "ECOM-SP", "SERR-ES", "VLVL-ES", "VTRA-ES"
];

const HORARIOS = [
  "09:00 às 15:00", "15:00 às 21:00", "14:00 às 20:00",
  "10:00 às 16:00", "13:00 às 19:00", "10:00 às 18:00",
  "12:00 às 18:00"
];

const TIPOS_SOLICITACAO = [
  { label: "Cancelamento", value: "Cancelamento" },
  { label: "Alteração", value: "Alteração" },
  { label: "Disponibilidade", value: "Disponibilidade" },
  { label: "Justificativa", value: "Justificativa" }
];

export default function EscalaMedicos() {
  // Estados
  const [formulario, setFormulario] = useState({
    medico: "",
    cnpj: "",
    coordenacao: "",
    tipoSolicitacao: "",
    observacoes: ""
  });
  
  const [unidades, setUnidades] = useState([]);
  const [enviando, setEnviando] = useState(false);

  // Helpers
  const dataMinima = format(startOfToday(), "yyyy-MM-dd");
  const validarCNPJ = useCallback((cnpj) => /^\d{14}$/.test(cnpj.replace(/\D/g, '')), []);

  // Manipulação de unidades
  const manipularUnidade = {
    adicionar: () => setUnidades([...unidades, { nome: "", dias: [] }]),
    remover: (index) => setUnidades(unidades.filter((_, i) => i !== index)),
    atualizar: (index, nome) => {
      const novasUnidades = [...unidades];
      novasUnidades[index].nome = nome;
      setUnidades(novasUnidades);
    }
  };

  // Manipulação de datas/horários
  const manipularData = {
    adicionar: (uIndex) => {
      const novasUnidades = [...unidades];
      novasUnidades[uIndex].dias.push({ data: "", horario: "" });
      setUnidades(novasUnidades);
    },
    remover: (uIndex, dIndex) => {
      const novasUnidades = [...unidades];
      novasUnidades[uIndex].dias.splice(dIndex, 1);
      setUnidades(novasUnidades);
    },
    atualizar: (uIndex, dIndex, campo, valor) => {
      if (campo === "data") {
        const data = new Date(valor);
        if (!isValid(data) || data < startOfToday()) {
          alert("Selecione uma data futura!");
          return;
        }
      }
      const novasUnidades = [...unidades];
      novasUnidades[uIndex].dias[dIndex][campo] = valor;
      setUnidades(novasUnidades);
    }
  };

  // Validação do formulário
  const validarFormulario = () => {
    const camposObrigatorios = Object.values(formulario).every(Boolean);
    const cnpjValido = validarCNPJ(formulario.cnpj);
    const unidadesValidas = unidades.every(u => 
      u.nome && u.dias.length > 0 && u.dias.every(d => d.data && d.horario)
    );

    if (!camposObrigatorios) alert("Preencha todos os campos obrigatórios!");
    else if (!cnpjValido) alert("CNPJ inválido! Use 14 dígitos");
    else if (!unidadesValidas) alert("Verifique unidades e datas!");

    return camposObrigatorios && cnpjValido && unidadesValidas;
  };

  // Envio dos dados
  const enviarDados = async () => {
    if (!validarFormulario()) return;
    setEnviando(true);

    try {
      const resposta = await fetch("/api/salvarNoSnowflake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formulario,
          cnpj: formulario.cnpj.replace(/\D/g, ''),
          unidades: unidades.map(unidade => ({
            ...unidade,
            dias: unidade.dias.map(dia => ({
              ...dia,
              data: format(new Date(dia.data), "dd/MM/yyyy")
            }))
          })
        })
      });

      if (!resposta.ok) throw new Error(await resposta.text());
      
      alert("Dados salvos!");
      setFormulario({
        medico: "",
        cnpj: "",
        coordenacao: "",
        tipoSolicitacao: "",
        observacoes: ""
      });
      setUnidades([]);
    } catch (erro) {
      alert(`Erro: ${erro.message}`);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-800">
          Gestão de Escalas Médicas
        </h1>
      </header>

      <main className="bg-white rounded-xl shadow-lg p-6">
        {/* Seção de Dados Cadastrais */}
        <section className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Médico *
            </label>
            <input
              type="text"
              value={formulario.medico}
              onChange={(e) => setFormulario({...formulario, medico: e.target.value})}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CNPJ *
            </label>
            <input
              type="text"
              value={formulario.cnpj}
              onChange={(e) => setFormulario({...formulario, cnpj: e.target.value})}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-300"
              inputMode="numeric"
              maxLength={14}
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coordenação *
            </label>
            <input
              type="text"
              value={formulario.coordenacao}
              onChange={(e) => setFormulario({...formulario, coordenacao: e.target.value})}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <Select
            options={TIPOS_SOLICITACAO}
            onChange={(selected) => setFormulario({...formulario, tipoSolicitacao: selected.value})}
            placeholder="Tipo de Solicitação *"
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </section>

        {/* Seção de Unidades */}
        <section className="space-y-6">
          {unidades.map((unidade, uIndex) => (
            <div key={uIndex} className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex gap-2 mb-4">
                <Select
                  options={UNIDADES.map(u => ({ label: u, value: u }))}
                  onChange={(selected) => manipularUnidade.atualizar(uIndex, selected.value)}
                  placeholder="Selecione a Unidade *"
                  className="flex-1 react-select-container"
                  classNamePrefix="react-select"
                />
                <button
                  onClick={() => manipularUnidade.remover(uIndex)}
                  className="px-3 py-1.5 text-red-600 hover:text-red-800 bg-red-100 rounded-md text-sm"
                >
                  Remover
                </button>
              </div>

              <div className="space-y-3">
                {unidade.dias.map((dia, dIndex) => (
                  <div key={dIndex} className="flex gap-2 items-center">
                    <input
                      type="date"
                      value={dia.data}
                      min={dataMinima}
                      onChange={(e) => manipularData.atualizar(uIndex, dIndex, "data", e.target.value)}
                      className="p-2 border rounded-md flex-1 focus:outline-none focus:ring-1 focus:ring-blue-300"
                    />
                    <Select
                      options={HORARIOS.map(h => ({ label: h, value: h }))}
                      onChange={(selected) => manipularData.atualizar(uIndex, dIndex, "horario", selected.value)}
                      placeholder="Horário *"
                      className="flex-1 react-select-container"
                      classNamePrefix="react-select"
                    />
                    <button
                      onClick={() => manipularData.remover(uIndex, dIndex)}
                      className="px-2 text-red-500 hover:text-red-700 text-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => manipularData.adicionar(uIndex)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Adicionar Data/Horário
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={manipularUnidade.adicionar}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            + Adicionar Nova Unidade
          </button>
        </section>

        {/* Observações */}
        <textarea
          placeholder="Observações Adicionais"
          value={formulario.observacoes}
          onChange={(e) => setFormulario({...formulario, observacoes: e.target.value})}
          className="w-full mt-6 p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 h-32"
        />

        {/* Botão de Envio Corrigido */}
        <button
          onClick={enviarDados}
          disabled={enviando}
          className={`mt-8 w-full py-2 rounded-md font-medium transition-colors ${
            enviando 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {enviando ? 'Salvando...' : 'Salvar Escala'}
        </button>
      </main>
    </div>
  );
}
