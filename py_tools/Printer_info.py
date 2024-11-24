import time
import tkinter as tk
from tkinter import ttk
from bambu_connect import BambuClient, PrinterStatus
from bambu_connect import AMSEntry
from dataclasses import asdict
from typing import Optional
import threading

# Udskift med dine faktiske oplysninger
hostname = '192.168.1.70'
access_code = '35654085'
serial = '01P00A381000021'

class AMSEntry:
    humidity: Optional[str] = None

class PrinterStatusApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Bambu Lab Printer Status")
        self.create_widgets()
        self.client = BambuClient(hostname, access_code, serial)
        self.client.start_watch_client(self.custom_callback, self.on_watch_client_connect)
        self.latest_status = {}

    def create_widgets(self):
        self.status_frame = ttk.LabelFrame(self.root, text="Printer Status")
        self.status_frame.grid(column=0, row=0, padx=10, pady=10, sticky="nsew")

        self.status_labels = {}
        for idx, (key, text) in enumerate({
            'gcode_state': 'State',
            'nozzle_target_temper': 'Nozzle Temperature',
            'bed_temper': 'Bed Temperature',
#            'chamber_temper': 'Chamber Temperature',
            'subtask_name': 'Job Name',
            'mc_percent': 'Progress',
            'mc_remaining_time': 'Time Remaining',
            'ams_humidity': 'AMS Humidity'
        }.items()):
            ttk.Label(self.status_frame, text=f"{text}:").grid(column=0, row=idx, sticky="w")
            self.status_labels[key] = ttk.Label(self.status_frame, text="N/A")
            self.status_labels[key].grid(column=1, row=idx, sticky="w")

        for child in self.status_frame.winfo_children():
            child.grid_configure(padx=5, pady=2)

    def custom_callback(self, msg: PrinterStatus):
        printer_status_dict = asdict(msg)
        self.latest_status = printer_status_dict

    def on_watch_client_connect(self):
        print("WatchClient connected, Waiting for connection...")
        time.sleep(1)  # Waits for 1 second
        print("Executing dump_info.")
        self.client.dump_info()

    def update_status(self):
        if self.latest_status:
            status = self.latest_status
            self.status_labels['gcode_state'].config(text=status.get('gcode_state', 'N/A'))
            self.status_labels['nozzle_target_temper'].config(text=f"{status.get('nozzle_target_temper', 'N/A')} °C")
            self.status_labels['bed_temper'].config(text=f"{status.get('bed_temper', 'N/A')} °C")
#            self.status_labels['chamber_temper'].config(text=f"{status.get('chamber_temper', 'N/A')} °C")
            self.status_labels['subtask_name'].config(text=status.get('subtask_name', 'N/A'))
            self.status_labels['mc_percent'].config(text=f"{status.get('mc_percent', 'N/A')} %")
            self.status_labels['mc_remaining_time'].config(text=f"{status.get('mc_remaining_time', 'N/A')} min")

            # Hent AMS-fugtighed
            ams_data = status.get('ams', {})
            if ams_data and 'ams' in ams_data and ams_data['ams']:
                ams_entry = ams_data['ams'][0]  # Antager, at der er mindst én AMS-enhed
                humidity = ams_entry.get('humidity', 'N/A')
                self.status_labels['ams_humidity'].config(text=f"{humidity} %")
            else:
                self.status_labels['ams_humidity'].config(text="N/A")
        else:
            for label in self.status_labels.values():
                label.config(text="N/A")

        self.root.after(5000, self.update_status)  # Opdater hvert 5. sekund

    def on_closing(self):
        self.client.stop_watch_client()
        self.root.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = PrinterStatusApp(root)
    root.protocol("WM_DELETE_WINDOW", app.on_closing)
    app.update_status()
    root.mainloop()
