"use client";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import "bootstrap/dist/css/bootstrap.min.css";
import { Tab, Tabs } from "react-bootstrap";
import * as React from 'react';


const socket = io("http://localhost:3000", {
  transports: ["websocket", "polling"],
});

export default function CallStatusDashboard() {
  const [calls, setCalls] = useState<{ index:number, id: string; status: string; queue_id: string; start_time: string; end_time?: string }[]>([]);
  const [events, setEvents] = useState<{ index:number, eventHistory: { timestamp: string; id: string; type: string, call_id: string }[] }>();
  const [statusFilter, setStatusFilter] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("");
  const [callIdFilter, setCallIdFilter] = useState("");
  const [activeTab, setActiveTab] = useState("calls");

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [statusFilter]);

  const fetchCalls = async () => {
    const url = statusFilter
      ? `http://localhost:3000/calls?status=${statusFilter}` : "http://localhost:3000/calls";
    try {
      const response = await fetch(url);
      const data = await response.json();
      setCalls(data);
    } catch (error) {
      console.error("Error fetching calls:", error);
    }
  };

  const fetchCreateCall = async () => {
    const url = new URL("http://localhost:3000/calls");

    try {
      await fetch(url.toString(), {
        method: "POST",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "id":crypto.randomUUID(),
          "status":"",
          "queue_id":"",
          "start_time": new Date().toISOString()
      })
      });

      fetchCalls();
      fetchEvents();
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchEvents = async () => {
    const url = new URL("http://localhost:3000/api/events");

    if (historyStatusFilter) url.searchParams.append("status", historyStatusFilter);
    if (callIdFilter) url.searchParams.append("call_id", callIdFilter);

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
        },
      });

      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const simulateCall = async (dataso:any) => {
    const url = new URL("http://localhost:3000/api/events");

    try {
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "queue_id":"",
          "call_id": dataso.id,
          "agent_id":"001",
          routing_time: 15,
          "event_type": "call_initiated",
          "type":"voice"
        })
      });

      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const postFetchEvents = async (dataso:any) => {
    const url = new URL("http://localhost:3000/api/events");

    if (historyStatusFilter) url.searchParams.append("status", historyStatusFilter);
    if (callIdFilter) url.searchParams.append("call_id", callIdFilter);

    try {
      const tipo_event = 
      dataso.status == "initiated" ? "call_routed":
      dataso.status == "routed" ? "call_answered":
      dataso.status == "active" ? "call_hold":
      dataso.status == "on_hold" ? "call_ended":
                          "";
      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "queue_id":"",
          "call_id": dataso.id,
          "agent_id":"001",
          routing_time: 15,
          "event_type": tipo_event,
          "type":"voice"
        })
      });

      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Conectado al servidor WebSocket");
      fetchEvents();

    });

    socket.on("disconnect", () => {
      console.log("Desconectado del servidor WebSocket");
    });

    socket.on("connect_error", (err) => {
      console.error("❗ Error de conexión:", err.message);
    });

    const handleCallUpdate = (data: {index:number; id: string; status: string; queue_id: string; start_time: string; end_time?: string }) => {
      console.log("Evento recibido:", data);
      if (!data.id) return;

      setCalls((prevCalls) => {
        const updatedCalls = prevCalls.map((call) =>
          call.id === data.id ? { ...call, status: data.status, queue_id: data.queue_id, start_time: data.start_time, end_time: data.end_time } : call
        );

        if (!updatedCalls.some(call => call.id === data.id)) {
          updatedCalls.push({ index: data.index,id: data.id, status: data.status, queue_id: data.queue_id, start_time: data.start_time, end_time: data.end_time });
        }

        return [...updatedCalls];
      });
      fetchEvents();
    };

    const passCall=(data:any)=>{
      postFetchEvents(data);
    }

    socket.on("call_initiated", handleCallUpdate);
    socket.on("call_update", handleCallUpdate);
    socket.on("call_pass", passCall);

    return () => {
      socket.off("call_initiated", handleCallUpdate);
      socket.off("call_update", handleCallUpdate);
      socket.off("call_pass", passCall);
    };
  }, []);



  

  useEffect(() => {
    if (activeTab === "history") {
      fetchEvents();
    }
  }, [activeTab, historyStatusFilter, callIdFilter]);

  return (

    <div style={{ margin: '10px', padding: '20px 5%', backgroundColor: 'rgb(220 255 223)' }}>
      <div style={{ marginBottom: "24px", justifyContent: "left", paddingTop: '20px' }}><h1>Prueba Técnica</h1> </div>
      <div>
        <button className="btn btn-primary mb-4" onClick={()=>fetchCreateCall()}>Generar Llamada</button>
      </div>

      <div>
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || "calls")} className="mb-3">
          <Tab eventKey="calls" title="Estado de Llamadas">
            <div className="mb-3">
              <label className="form-label">Filtrar por Estado:</label>
              <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">Todos</option>
                <option value="waiting">En espera</option>
                <option value="initiated">Iniciada</option>
                <option value="routed">Enrutada</option>
                <option value="active">Activa</option>
                <option value="on_hold">En espera</option>
                <option value="ended">Finalizada</option>
              </select>
            </div>

            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-primary">
                  <tr>
                    <th>Call ID</th>
                    <th>Estado</th>
                    <th>Código de Cola</th>
                    <th>Fecha-Hora Inicio</th>
                    <th>Fecha-Hora Fin</th>
                    <th>Simular</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center">No hay llamadas activas</td>
                    </tr>
                  ) : (
                    calls.map((call) => (
                      <tr key={call.index}>
                        <td>{call.id}</td>
                        <td className="text-capitalize">{call.status.replace("_", " ")}</td>
                        <td className="text-capitalize">{call.queue_id.replace("_", " ")}</td>
                        <td>{call.start_time}</td>
                        <td>{call.end_time || "En curso"}</td>
                        <td><button className="btn btn-primary" onClick={()=>simulateCall(call)}>Simular</button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Tab>

          <Tab eventKey="history" title="Historial de Eventos">
            <div className="mb-3">
              <label className="form-label">Filtrar por Cola:</label>
              <select className="form-select" value={historyStatusFilter} onChange={(e) => setHistoryStatusFilter(e.target.value)}>
                <option value="">Todos</option>
                <option value="call_initiated">Llamada Iniciada</option>
                <option value="call_routed">Llamada Enrutada</option>
                <option value="call_answered">Llamada Activa</option>
                <option value="call_hold">Llamada En espera</option>
                <option value="call_ended">Llamada Finalizada</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Filtrar por Call ID:</label>
              <input type="text" className="form-control" value={callIdFilter} onChange={(e) => setCallIdFilter(e.target.value)} />
            </div>

            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-primary">
                  <tr>
                    <th>ID</th>
                    <th>Call ID</th>
                    <th>Estado</th>
                    <th>Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {events?.eventHistory?.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center">No hay eventos recientes</td>
                    </tr>
                  ) : (
                    events?.eventHistory?.map((event, index) => (
                      <tr key={index}>
                        <td>{event.id}</td>
                        <td>{event.call_id}</td>
                        <td className="text-capitalize">{event.type.replace("_", " ")}</td>
                        <td>{event.timestamp}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
