// src/components/ChartWidget.jsx
import React, { useRef, useEffect } from "react";
import { Line, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend } from "chart.js";
import PropTypes from "prop-types"; // Ajouter cette ligne pour importer PropTypes

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

export const ChartWidget = ({ type, data }) => {
  const chartRef = useRef(null); // Référence au canvas

  useEffect(() => {
    // Nettoyer le chart précédent lors de chaque mise à jour
    if (chartRef.current && chartRef.current.chartInstance) {
      chartRef.current.chartInstance.destroy();
    }
  }, [data]);

  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
        borderColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div>
      {type === "line" && (
        <Line
          data={chartData}
          options={options}
          ref={(ref) => (chartRef.current = ref)} // Assigner la référence
        />
      )}
      {type === "pie" && (
        <Pie
          data={chartData}
          options={options}
          ref={(ref) => (chartRef.current = ref)} // Assigner la référence
        />
      )}
    </div>
  );
};

// Ajouter la validation des props ici
ChartWidget.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired, // Chaque élément doit avoir un champ 'label' de type string
      value: PropTypes.number.isRequired, // Chaque élément doit avoir un champ 'value' de type number
    })
  ).isRequired, // La prop 'data' est obligatoire et doit être un tableau
};