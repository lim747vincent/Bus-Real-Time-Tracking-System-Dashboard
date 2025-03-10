import React from "react";
import "./datatable.scss";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { columnTitle } from "../../data";
import Modal from "../../components/modal/Modal";
import Tooltips from "@mui/material/Tooltip";
import { request } from "../../axios_Helper.js";

const DataTable = (props) => {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [openInfo, setOpenInfo] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request("GET", "http://localhost:8090/api/v1/" + props.slug, {})
      .then((response) => {
        setData(response.data);

        setRowCount(data.totalCount ?? 0);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err.message);
      });

    if (["drivers", "buses", "routes"].includes(props.slug)) {
      request("GET", "http://localhost:8090/api/v1/schedules", {})
        .then((response) => setSchedules(response.data))
        .catch((err) => console.log(err.message));
    }

    return setData([]);
  }, [props.slug, data.totalCount]);

  let title,
    column,
    message,
    showAddButton = true;

  switch (props.slug) {
    case "students":
      title = "Students";
      column = columnTitle.find((item) => item.slug === "students").listItems;
      message =
        "Active = Student is studying in uni\nInactive = Student not study in uni\nPending = Student application processing";
      break;
    case "staffs":
      title = "Staffs";
      column = columnTitle.find((item) => item.slug === "staffs").listItems;
      message = "IsAdmin = Yes mean the staff is admnistratior. Otherwise not.";
      break;
    case "drivers":
      title = "Drivers";
      column = columnTitle.find((item) => item.slug === "drivers").listItems;
      message = "Each drive come with unique email";
      break;
    case "buses":
      title = "Buses";
      column = columnTitle.find((item) => item.slug === "buses").listItems;
      message = "Bus active mean the bus is under usage. Otherwise not";
      break;
    case "announcements":
      title = "Announcement";
      column = columnTitle.find(
        (item) => item.slug === "announcements"
      ).listItems;
      message = "Announcement cannot be edit or delete.";
      break;
    case "schedules":
      title = "Schedule";
      column = columnTitle.find((item) => item.slug === "schedules").listItems;
      message = "Bus active mean the bus is under usage. Otherwise not";
      break;
    case "routes":
      title = "Route";
      column = columnTitle.find((item) => item.slug === "routes").listItems;
      message = "Each of the route has own managed bus stops.";
      break;
    default:
  }

  const isReferenced = (id) => {
    if (props.slug === "drivers") {
      return schedules.some((schedule) => schedule.schedule_driver === id);
    } else if (props.slug === "buses") {
      return schedules.some((schedule) => schedule.schedule_bus === id);
    } else if (props.slug === "routes") {
      return schedules.some((schedule) => schedule.schedule_route === id);
    }
    return false;
  };

  const deleteData = async () => {
    if (isReferenced(selectedId)) {
      alert("Cannot delete! This item is assigned to a schedule.");
      setOpen(false);
      return;
    }

    try {
      await request(
        "DELETE",
        `http://localhost:8090/api/v1/${props.slug}/${selectedId}`,
        {}
      );

      setData((prev) => prev.filter((item) => item.id !== selectedId));
      console.log("Successfully deleted data");
    } catch (error) {
      console.error("Error deleting data:", error);
    }
  };

  const handleDeleteClick = (id) => {
    setSelectedId(id);
    setOpen(true);
  };

  const actionColumn = [
    {
      field: "action",
      headerName: "Action",
      flex: 0.5,
      renderCell: (params) => {
        return (
          <div className="cellAction">
            {" "}
            <Tooltips title="View Details">
              <div className="viewButton">
                <Link to={`/${props.slug}/${params.row.id}`}>
                  <img src="/media/view.svg" alt="" />
                </Link>
              </div>
            </Tooltips>
            {props.slug !== "announcements" && (
              <Tooltips title="Delete Item">
                <div
                  className="deleteButton"
                  onClick={() => {
                    handleDeleteClick(params.row.id);
                  }}
                >
                  <img src="/media/delete.svg" alt="" />
                </div>
              </Tooltips>
            )}
            {props.slug === "routes" && (
              <Tooltips title="View Stops">
                <div className="viewStopsButton">
                  <Link to={`/${props.slug}/${params.row.id}/viewStop`}>
                    <img src="/media/manageStop.svg" alt="" />
                  </Link>
                </div>
              </Tooltips>
            )}
          </div>
        );
      },
    },
  ];

  if (user.isAdmin === "No" && props.slug === "staffs") {
    return <p>Only admins are allowed to view</p>;
  }

  return (
    <div className="datatable">
      <div className="datatableTitle">
        <h2>{title}</h2>
        <div className="link">
          {showAddButton && (
            <Link to={"/" + props.slug + "/new"} className="addNewLink">
              Add New
            </Link>
          )}

          <Tooltips title="More Info">
            {" "}
            <div
              className="infoLink my-anchor-element"
              data-tooltip-id="info-tooltip"
              onClick={() => setOpenInfo(true)}
            >
              <img src="/media/info.svg" alt="Info" />
            </div>
          </Tooltips>
        </div>
      </div>

      <DataGrid
        className="dataGrid"
        getCellClassName={() => "cell"}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
        }
        rows={data}
        columns={[...column, ...actionColumn]}
        loading={loading}
        paginationMode="client"
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 10,
            },
          },
        }}
        pageSizeOptions={[5, 10, 20]}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        disableRowSelectionOnClick
        disableDensitySelector
        disableColumnSelector
      />

      {open && <Modal setOpen={setOpen} action={deleteData} type="delete" />}
      {openInfo && (
        <Modal setOpen={setOpenInfo} type="info" message={message} />
      )}
    </div>
  );
};

export default DataTable;
