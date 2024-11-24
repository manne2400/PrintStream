import time
from bambu_connect import BambuClient, PrinterStatus
from bambu_connect import AMSEntry
from dataclasses import asdict
import json

class PrinterMonitor:
    def __init__(self, hostname, access_code, serial):
        self.client = BambuClient(hostname, access_code, serial)
        
    def custom_callback(self, msg: PrinterStatus):
        printer_status_dict = asdict(msg)
        
        # Brug præcis samme datastruktur som i din originale version
        status_data = {
            'gcode_state': printer_status_dict.get('gcode_state'),
            'nozzle_temper': printer_status_dict.get('nozzle_temper'),
            'bed_temper': printer_status_dict.get('bed_temper'),
            'subtask_name': printer_status_dict.get('subtask_name'),
            'mc_percent': printer_status_dict.get('mc_percent'),
            'mc_remaining_time': printer_status_dict.get('mc_remaining_time'),
            'ams_humidity': printer_status_dict.get('ams', {}).get('ams', [{}])[0].get('humidity', 'N/A')
        }
        
        # Gem til JSON fil
        with open('printer_status.json', 'w', encoding='utf-8') as f:
            json.dump(status_data, f, indent=2)

    def start_monitoring(self):
        self.client.start_watch_client(
            self.custom_callback,
            self.on_watch_client_connect
        )

    def on_watch_client_connect(self):
        print("WatchClient connected")
        time.sleep(1)
        self.client.dump_info()

    def stop_monitoring(self):
        self.client.stop_watch_client()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--ip', required=True)
    parser.add_argument('--code', required=True)
    parser.add_argument('--serial', required=True)
    
    args = parser.parse_args()

    monitor = PrinterMonitor(args.ip, args.code, args.serial)
    
    try:
        print("Starting printer monitoring...")
        monitor.start_monitoring()
        while True:
            time.sleep(2)
    except KeyboardInterrupt:
        print("Stopping printer monitoring...")
        monitor.stop_monitoring()
