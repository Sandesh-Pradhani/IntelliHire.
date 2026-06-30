import time
from contextlib import contextmanager
from dataclasses import dataclass


@dataclass
class TimingResult:
    start: float
    end: float | None = None

    @property
    def ms(self) -> float:
        end = self.end if self.end is not None else time.perf_counter()
        return round((end - self.start) * 1000.0, 3)


@contextmanager
def time_block() -> TimingResult:
    t = TimingResult(start=time.perf_counter())
    try:
        yield t
    finally:
        t.end = time.perf_counter()

