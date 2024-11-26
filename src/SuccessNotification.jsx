import React from "react";
import { Snackbar } from "@material-ui/core";
import { Alert } from "@material-ui/lab";

function SuccessNotification({ open, SetOpen }) {

	const handleClose = (_, __) => {
		// Prevent closing when clicking outside or pressing Esc
		SetOpen(false);
	};

	return (
		<div>
			<Snackbar
				open={open}
				autoHideDuration={1500}
				onClose={handleClose}
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
			>
				<Alert onClose={handleClose} severity="success" sx={{ width: "100%" }}>
					Saved
				</Alert>
			</Snackbar>
		</div>
	);
}

export default SuccessNotification;
